// ============================================
// Statistics Controller
// ============================================

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * GET /api/stats
 * Получить статистику для дашборда
 */
export async function getStats(req: Request, res: Response) {
  try {
    // Получаем все данные параллельно
    const [
      restaurantsResult,
      activeRestaurantsResult,
      ordersResult,
      pendingOrdersResult,
      usersResult,
      bannersResult,
      todayOrdersResult
    ] = await Promise.all([
      // Всего ресторанов
      supabase.from('restaurants').select('id', { count: 'exact', head: true }),
      // Активных ресторанов
      supabase.from('restaurants').select('id', { count: 'exact', head: true }).eq('is_active', true),
      // Всего заказов
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      // Заказов в ожидании
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      // Всего пользователей
      supabase.from('users').select('id', { count: 'exact', head: true }),
      // Всего баннеров
      supabase.from('banners').select('id', { count: 'exact', head: true }),
      // Заказов сегодня
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0])
    ]);

    // Обрабатываем ошибки
    const errors = [
      restaurantsResult.error,
      activeRestaurantsResult.error,
      ordersResult.error,
      pendingOrdersResult.error,
      usersResult.error,
      bannersResult.error,
      todayOrdersResult.error
    ].filter(Boolean);

    if (errors.length > 0) {
      throw errors[0];
    }

    const stats = {
      totalRestaurants: restaurantsResult.count || 0,
      activeRestaurants: activeRestaurantsResult.count || 0,
      totalOrders: ordersResult.count || 0,
      pendingOrders: pendingOrdersResult.count || 0,
      totalUsers: usersResult.count || 0,
      totalBanners: bannersResult.count || 0,
      todayOrders: todayOrdersResult.count || 0,
      todayRevenue: 0 // Выручка не рассчитывается, так как в схеме нет поля total_price
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      message: error.message
    });
  }
}

/**
 * GET /api/stats/restaurant/:restaurantId
 * Получить статистику для конкретного ресторана
 */
export async function getRestaurantStats(req: Request, res: Response) {
  try {
    const { restaurantId } = req.params;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'restaurantId is required'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Получаем все данные параллельно
    const [
      totalOrdersResult,
      pendingOrdersResult,
      todayOrdersResult,
      allOrdersResult
    ] = await Promise.all([
      // Всего заказов для ресторана
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId),
      // Заказов в ожидании
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('status', 'pending'),
      // Заказов сегодня
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .gte('created_at', todayISO),
      // Все заказы для расчета средней суммы (если будет поле total_price)
      supabase
        .from('orders')
        .select('id, created_at')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    // Обрабатываем ошибки
    const errors = [
      totalOrdersResult.error,
      pendingOrdersResult.error,
      todayOrdersResult.error,
      allOrdersResult.error
    ].filter(Boolean);

    if (errors.length > 0) {
      throw errors[0];
    }

    const stats = {
      todayOrders: todayOrdersResult.count || 0,
      todayRevenue: 0, // Выручка не рассчитывается, так как в схеме нет поля total_price
      pendingOrders: pendingOrdersResult.count || 0,
      totalOrders: totalOrdersResult.count || 0,
      totalRevenue: 0, // Выручка не рассчитывается, так как в схеме нет поля total_price
      averageOrderValue: 0 // Средний чек не рассчитывается, так как в схеме нет поля total_price
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching restaurant stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch restaurant stats',
      message: error.message
    });
  }
}

