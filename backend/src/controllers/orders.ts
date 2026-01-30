// ============================================
// Orders Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { Order, OrderStatus } from '../types';
import {
  sendOrderToChef,
  notifyUserAboutOrderStatus
} from '../services/telegramNotification';
import { AuthenticatedRequest } from '../middleware/auth';
import { validateUuid, validateString, validateCoordinate } from '../utils/validation';
import { Logger } from '../services/logger';

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
 * Публичный доступ (для клиентов)
 */
export async function createOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id, user_id, order_text, address, latitude, longitude } = req.body;

    // Валидация обязательных полей
    if (!restaurant_id || !user_id || !order_text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: restaurant_id, user_id, order_text'
      });
    }

    // Валидация форматов
    if (!validateUuid(restaurant_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid restaurant_id format'
      });
    }

    if (!validateUuid(user_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user_id format'
      });
    }

    if (!validateString(order_text, 1, 5000)) {
      return res.status(400).json({
        success: false,
        error: 'Order text must be between 1 and 5000 characters'
      });
    }

    if (address !== undefined && address !== null && !validateString(address, 0, 500)) {
      return res.status(400).json({
        success: false,
        error: 'Address must be less than 500 characters'
      });
    }

    if (latitude !== undefined && latitude !== null && !validateCoordinate(latitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid latitude value (must be between -180 and 180)'
      });
    }

    if (longitude !== undefined && longitude !== null && !validateCoordinate(longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid longitude value (must be between -180 and 180)'
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
      })
      // Уведомления админам ресторана теперь отправляются после нажатия поваром "Tayyor"
    ]).catch((error) => {
      console.error('Error sending notifications:', error);
      // Не прерываем создание заказа, если уведомления не отправились
    });

    // Логирование создания заказа
    Logger.logCreate('order', data.id, user_id, 'mijoz', req.ip);

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
 * Админ ресторана видит только заказы своего ресторана
 */
export async function getOrders(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id, status, archived, page, limit } = req.query;

    // Параметры пагинации
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;

    // Проверка прав доступа
    if (req.user) {
      // Админы ресторана и повары видят только заказы своего ресторана
      if (req.user.role === 'restaurant_admin' || req.user.role === 'chef') {
        // Если указан restaurant_id в запросе, проверяем что он совпадает с рестораном пользователя
        if (restaurant_id && restaurant_id !== req.user.restaurant_id) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: You can only view orders of your own restaurant'
          });
        }
        // Принудительно устанавливаем restaurant_id для админов ресторана и поваров
        const effectiveRestaurantId = restaurant_id || req.user.restaurant_id;
        // Используем effectiveRestaurantId дальше в запросе
      }
    }

    // Определяем restaurant_id для фильтрации
    let effectiveRestaurantId = restaurant_id as string | undefined;
    if (req.user && (req.user.role === 'restaurant_admin' || req.user.role === 'chef')) {
      effectiveRestaurantId = req.user.restaurant_id;
    }

    // Запрос для получения общего количества (для пагинации)
    let countQuery = supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (effectiveRestaurantId) {
      countQuery = countQuery.eq('restaurant_id', effectiveRestaurantId);
    }

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    // Фильтрация по архиву
    if (archived === 'true') {
      countQuery = countQuery.not('archived_at', 'is', null);
    } else {
      countQuery = countQuery.is('archived_at', null);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    // Запрос для получения данных с пагинацией
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (effectiveRestaurantId) {
      query = query.eq('restaurant_id', effectiveRestaurantId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Фильтрация по архиву
    if (archived === 'true') {
      query = query.not('archived_at', 'is', null);
    } else {
      query = query.is('archived_at', null);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const totalPages = Math.ceil((count || 0) / limitNum);

    res.json({
      success: true,
      data: data as Order[],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
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
export async function getOrderById(req: AuthenticatedRequest, res: Response) {
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
export async function updateOrderStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, changed_by = 'restaurant', telegram_id } = req.body;

    // Валидация статуса
    const validStatuses: OrderStatus[] = ['pending', 'accepted', 'ready', 'assigned_to_courier', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Проверка существования заказа
    const { data: existingOrder, error: orderError } = await supabase
      .from('orders')
      .select('id, status, user_id, restaurant_id')
      .eq('id', id)
      .single();

    if (orderError || !existingOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Проверка прав доступа
    if (req.user) {
      // Супер-админы могут обновлять статусы любых заказов
      if (req.user.role !== 'super_admin') {
        // Админы ресторана и повары могут обновлять только заказы своего ресторана
        if ((req.user.role === 'restaurant_admin' || req.user.role === 'chef') 
            && req.user.restaurant_id !== existingOrder.restaurant_id) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: You can only update orders of your own restaurant'
          });
        }
      }
    }

    // Обновление статуса (и courier_id, если статус assigned_to_courier)
    const updateData: any = { status };
    
    // Если статус assigned_to_courier и передан courier_id, обновляем courier_id
    if (status === 'assigned_to_courier' && req.body.courier_id) {
      updateData.courier_id = req.body.courier_id;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
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


