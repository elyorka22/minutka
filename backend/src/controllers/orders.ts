// ============================================
// Orders Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { Order, OrderStatus } from '../types';
import {
  sendOrderToChef,
  notifyUserAboutOrderStatus,
  notifyUserByTelegramId
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
    const { restaurant_id, user_id, user_telegram_id, order_text, address, latitude, longitude } = req.body;

    // Валидация обязательных полей
    // restaurant_id может быть null для заказов товаров главной страницы
    if (!order_text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: order_text'
      });
    }

    // Валидация форматов
    // Если restaurant_id указан, он должен быть валидным UUID
    if (restaurant_id !== null && restaurant_id !== undefined && !validateUuid(restaurant_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid restaurant_id format'
      });
    }

    // user_id опционален, но если указан - должен быть валидным UUID
    if (user_id !== null && user_id !== undefined && !validateUuid(user_id)) {
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

    // Проверка существования ресторана (если указан)
    // Если restaurant_id = null, это заказ товаров главной страницы
    if (restaurant_id) {
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
    }

    // Создание заказа
    // user_telegram_id используется для уведомлений, user_id может быть null
    const { data, error } = await supabase
      .from('orders')
      .insert({
        restaurant_id,
        user_id: user_id || null,
        user_telegram_id: user_telegram_id || null,
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

    // Формируем имя пользователя для уведомлений
    // Используем "Foydalanuvchi" по умолчанию, так как пользователь не создается
    const userName = 'Foydalanuvchi';

    // Отправляем уведомления асинхронно (не блокируем ответ)
    Promise.all([
      // Если restaurant_id = null, это заказ товаров главной страницы - уведомляем супер-админов
      // Если restaurant_id указан, уведомляем админов ресторана
      restaurant_id 
        ? sendOrderToChef(data.id, restaurant_id, {
            orderText: order_text,
            address,
            userName
          })
        : (async () => {
            // Импортируем функцию уведомления супер-админов
            const { notifySuperAdminsAboutNewOrder } = await import('../services/telegramNotification');
            await notifySuperAdminsAboutNewOrder(data.id, {
              restaurantName: 'Главная страница',
              orderText: order_text,
              address,
              userName
            });
          })()
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
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    
    // Если это ошибка валидации от Supabase, возвращаем более понятное сообщение
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        error: 'Order already exists',
        message: error.message
      });
    }
    
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({
        success: false,
        error: 'Invalid restaurant_id or user_id',
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      message: error.message || 'Unknown error occurred'
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
      .select('id, status, user_id, user_telegram_id, restaurant_id, courier_id')
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
        // Курьеры могут обновлять статус на 'delivered' только для заказов, которые им назначены
        if (req.user.role === 'courier') {
          if (status !== 'delivered') {
            return res.status(403).json({
              success: false,
              error: 'Forbidden: Couriers can only change status to delivered'
            });
          }
          if (existingOrder.courier_id !== req.user.courier_id) {
            return res.status(403).json({
              success: false,
              error: 'Forbidden: You can only update orders assigned to you'
            });
          }
        }
        // Админы ресторана и повары могут обновлять только заказы своего ресторана
        else if ((req.user.role === 'restaurant_admin' || req.user.role === 'chef') 
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
    // Используем user_telegram_id если есть, иначе пытаемся получить через user_id
    if (existingOrder.user_telegram_id) {
      // Отправляем уведомление напрямую по telegram_id
      notifyUserByTelegramId(existingOrder.user_telegram_id, id, status).catch((error: any) => {
        console.error('Error notifying user by telegram_id:', error);
      });
    } else if (existingOrder.user_id) {
      // Fallback: используем старый метод через user_id
      notifyUserAboutOrderStatus(existingOrder.user_id, id, status).catch((error) => {
        console.error('Error notifying user about order status:', error);
      });
    }

    // Уведомление курьеров теперь происходит только через бота, когда админ нажимает "Передать курьеру"
    // Не уведомляем курьеров автоматически при изменении статуса через API
    // Это предотвращает двойные уведомления и обеспечивает правильный порядок: админ -> курьер

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

/**
 * POST /api/orders/:id/assign-to-general-courier
 * Передать заказ общему курьеру (restaurant_id IS NULL)
 */
export async function assignOrderToGeneralCourier(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!validateUuid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid order ID format' });
    }

    // Получаем заказ
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Проверяем, что заказ не доставлен и не отменен
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({ success: false, error: 'Cannot assign delivered or cancelled order' });
    }

    // Обновляем статус на assigned_to_courier
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'assigned_to_courier' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Уведомляем общих курьеров (restaurant_id IS NULL)
    Promise.all([
      supabase.from('restaurants').select('name').eq('id', order.restaurant_id).single(),
      supabase.from('users').select('phone').eq('id', order.user_id).single(),
      supabase.from('orders').select('order_text, address').eq('id', id).single()
    ]).then(async ([restaurantResult, userResult, orderResult]) => {
      const restaurant = restaurantResult.data;
      const user = userResult.data;
      const orderData = orderResult.data;

      if (orderData) {
        const totalMatch = orderData.order_text.match(/Jami:\s*(\d+)/i) || orderData.order_text.match(/Total:\s*(\d+)/i) || orderData.order_text.match(/💰\s*(\d+)/i);
        const total = totalMatch ? `${totalMatch[1]} so'm` : 'Ko\'rsatilmagan';

        const { notifyCouriersAboutOrder } = await import('../services/courierNotification');
        await notifyCouriersAboutOrder(id, {
          restaurantName: restaurant?.name || 'Restoran',
          orderText: orderData.order_text,
          address: orderData.address,
          userPhone: user?.phone || null,
          total
        }, null).catch((error) => {
          console.error('[Assign to General Courier] Error notifying couriers:', error);
        });
      }
    }).catch((error) => {
      console.error('[Assign to General Courier] Error fetching order details:', error);
    });

    res.json({ success: true, data: updatedOrder as Order });
  } catch (error: any) {
    console.error('Error assigning order to general courier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign order to general courier',
      message: error.message
    });
  }
}

/**
 * POST /api/orders/:id/assign-to-restaurant-courier
 * Передать заказ курьеру ресторана (restaurant_id = order.restaurant_id)
 */
export async function assignOrderToRestaurantCourier(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!validateUuid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid order ID format' });
    }

    // Получаем заказ
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Проверяем, что заказ не доставлен и не отменен
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({ success: false, error: 'Cannot assign delivered or cancelled order' });
    }

    // Обновляем статус на assigned_to_courier
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'assigned_to_courier' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Уведомляем курьеров ресторана (restaurant_id = order.restaurant_id)
    Promise.all([
      supabase.from('restaurants').select('name').eq('id', order.restaurant_id).single(),
      supabase.from('users').select('phone').eq('id', order.user_id).single(),
      supabase.from('orders').select('order_text, address').eq('id', id).single()
    ]).then(async ([restaurantResult, userResult, orderResult]) => {
      const restaurant = restaurantResult.data;
      const user = userResult.data;
      const orderData = orderResult.data;

      if (orderData) {
        const totalMatch = orderData.order_text.match(/Jami:\s*(\d+)/i) || orderData.order_text.match(/Total:\s*(\d+)/i) || orderData.order_text.match(/💰\s*(\d+)/i);
        const total = totalMatch ? `${totalMatch[1]} so'm` : 'Ko\'rsatilmagan';

        const { notifyCouriersAboutOrder } = await import('../services/courierNotification');
        await notifyCouriersAboutOrder(id, {
          restaurantName: restaurant?.name || 'Restoran',
          orderText: orderData.order_text,
          address: orderData.address,
          userPhone: user?.phone || null,
          total
        }, order.restaurant_id).catch((error) => {
          console.error('[Assign to Restaurant Courier] Error notifying couriers:', error);
        });
      }
    }).catch((error) => {
      console.error('[Assign to Restaurant Courier] Error fetching order details:', error);
    });

    res.json({ success: true, data: updatedOrder as Order });
  } catch (error: any) {
    console.error('Error assigning order to restaurant courier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign order to restaurant courier',
      message: error.message
    });
  }
}

