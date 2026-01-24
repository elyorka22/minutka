// ============================================
// Orders Controller
// ============================================

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { Order, OrderStatus } from '../types';
import {
  sendOrderToChef,
  notifySuperAdminsAboutNewOrder,
  notifyRestaurantAdminsAboutNewOrder,
  notifyUserAboutOrderStatus
} from '../services/telegramNotification';

/**
 * POST /api/orders
 * Создать новый заказ
 * Body: {
 *   restaurant_id: string,
 *   user_id: string,
 *   order_text: string,
 *   address?: string,
 *   latitude?: number,
 *   longitude?: number
 * }
 */
export async function createOrder(req: Request, res: Response) {
  try {
    const { restaurant_id, user_id, order_text, address, latitude, longitude } = req.body;

    // Валидация
    if (!restaurant_id || !user_id || !order_text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: restaurant_id, user_id, order_text'
      });
    }

    // Проверка существования ресторана
    const { data: restaurantCheck, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, is_active')
      .eq('id', restaurant_id)
      .single();

    if (restaurantError || !restaurantCheck || !restaurantCheck.is_active) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found or inactive'
      });
    }

    // Создание заказа
    const { data, error } = await supabase
      .from('orders')
      .insert({
        restaurant_id,
        user_id,
        order_text,
        address: address || null,
        latitude: latitude || null,
        longitude: longitude || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Логируем статус в историю
    await supabase
      .from('order_status_history')
      .insert({
        order_id: data.id,
        status: 'pending',
        changed_by: 'user'
      });

    // Получаем информацию о пользователе и ресторане для уведомлений
    const [userResult, restaurantResult] = await Promise.all([
      supabase
        .from('users')
        .select('first_name, username')
        .eq('id', user_id)
        .single(),
      supabase
        .from('restaurants')
        .select('name')
        .eq('id', restaurant_id)
        .single()
    ]);

    const user = userResult.data;
    const restaurantInfo = restaurantResult.data;
    const userName = user?.username ? `@${user.username}` : (user?.first_name || 'Foydalanuvchi');

    // Отправляем уведомления асинхронно (не блокируем ответ)
    Promise.all([
      // Отправляем заказ повару
      sendOrderToChef(data.id, restaurant_id, {
        orderText: order_text,
        address,
        userName
      }).then((messageId) => {
        // Сохраняем ID сообщения в БД
        if (messageId) {
          return supabase
            .from('orders')
            .update({ telegram_message_id: messageId })
            .eq('id', data.id);
        }
      }),
      // Уведомляем супер-админов
      notifySuperAdminsAboutNewOrder(data.id, {
        restaurantName: restaurantInfo?.name || 'Noma\'lum restoran',
        orderText: order_text,
        address,
        userName
      }),
      // Уведомляем админов ресторана
      notifyRestaurantAdminsAboutNewOrder(restaurant_id, data.id, {
        orderText: order_text,
        address,
        userName
      })
    ]).catch((error) => {
      console.error('Error sending notifications:', error);
      // Не прерываем создание заказа, если уведомления не отправились
    });

    res.status(201).json({
      success: true,
      data: data as Order
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      message: error.message
    });
  }
}

/**
 * GET /api/orders
 * Получить список заказов
 * Query params: restaurant_id (optional), status (optional)
 */
export async function getOrders(req: Request, res: Response) {
  try {
    const { restaurant_id, status } = req.query;

    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (restaurant_id) {
      query = query.eq('restaurant_id', restaurant_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data as Order[]
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      message: error.message
    });
  }
}

/**
 * GET /api/orders/:id
 * Получить заказ по ID с деталями
 */
export async function getOrderById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        restaurant:restaurants(*),
        user:users(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order',
      message: error.message
    });
  }
}

/**
 * PATCH /api/orders/:id/status
 * Обновить статус заказа
 * Body: { status: OrderStatus, changed_by?: string, telegram_id?: number }
 */
export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, changed_by = 'restaurant', telegram_id } = req.body;

    // Валидация статуса
    const validStatuses: OrderStatus[] = ['pending', 'accepted', 'ready', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Проверка существования заказа
    const { data: existingOrder, error: orderError } = await supabase
      .from('orders')
      .select('id, status, user_id')
      .eq('id', id)
      .single();

    if (orderError || !existingOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Обновление статуса
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Логируем изменение статуса
    await supabase
      .from('order_status_history')
      .insert({
        order_id: id,
        status,
        changed_by,
        telegram_id: telegram_id || null
      });

    // Уведомляем пользователя об изменении статуса (асинхронно)
    if (existingOrder.user_id) {
      notifyUserAboutOrderStatus(existingOrder.user_id, id, status).catch((error) => {
        console.error('Error notifying user about order status:', error);
      });
    }

    res.json({
      success: true,
      data: data as Order
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status',
      message: error.message
    });
  }
}


