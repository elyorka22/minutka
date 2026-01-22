// ============================================
// Orders Controller
// ============================================

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { Order, OrderStatus } from '../types';

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
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, is_active')
      .eq('id', restaurant_id)
      .single();

    if (restaurantError || !restaurant || !restaurant.is_active) {
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
      .select('id, status')
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


