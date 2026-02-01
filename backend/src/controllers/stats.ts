// ============================================
// Statistics Controller
// ============================================

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * Парсит сумму из order_text
 * Ищет паттерны: "Jami: 10000 so'm", "💰 10000 so'm", "Jami: 10000", и т.д.
 */
function parseOrderTotal(orderText: string): number {
  if (!orderText) return 0;
  
  const lines = orderText.split('\n');
  for (const line of lines) {
    // Ищем строки с "Jami:" или "💰"
    if (line.includes('Jami:') || line.includes('💰')) {
      // Извлекаем числа из строки
      const match = line.match(/(\d[\d\s]*)/);
      if (match) {
        // Убираем пробелы и преобразуем в число
        const amount = parseInt(match[1].replace(/\s/g, ''), 10);
        if (!isNaN(amount) && amount > 0) {
          return amount;
        }
      }
    }
  }
  return 0;
}

/**
 * GET /api/stats
 * Получить статистику для дашборда
 */
export async function getStats(req: Request, res: Response) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Получаем все данные параллельно
    const [
      restaurantsResult,
      activeRestaurantsResult,
      ordersResult,
      pendingOrdersResult,
      usersResult,
      bannersResult,
      todayOrdersResult,
      deliveredOrdersResult,
      todayDeliveredOrdersResult,
      uniqueOrderUsersResult
    ] = await Promise.all([
      // Всего ресторанов
      supabase.from('restaurants').select('id', { count: 'exact', head: true }),
      // Активных ресторанов
      supabase.from('restaurants').select('id', { count: 'exact', head: true }).eq('is_active', true),
      // Всего заказов
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      // Заказов в ожидании
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      // Всего пользователей бота (только с telegram_id - реальные пользователи)
      supabase.from('users').select('id', { count: 'exact', head: true }).not('telegram_id', 'is', null),
      // Всего баннеров
      supabase.from('banners').select('id', { count: 'exact', head: true }),
      // Заказов сегодня
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayISO),
      // Доставленные заказы (для расчета общей выручки)
      supabase
        .from('orders')
        .select('order_text')
        .eq('status', 'delivered'),
      // Доставленные заказы сегодня
      supabase
        .from('orders')
        .select('order_text')
        .eq('status', 'delivered')
        .gte('created_at', todayISO),
      // Уникальные пользователи, которые делали заказы (по user_telegram_id)
      supabase
        .from('orders')
        .select('user_telegram_id')
        .not('user_telegram_id', 'is', null)
    ]);

    // Обрабатываем ошибки
    const errors = [
      restaurantsResult.error,
      activeRestaurantsResult.error,
      ordersResult.error,
      pendingOrdersResult.error,
      usersResult.error,
      bannersResult.error,
      todayOrdersResult.error,
      deliveredOrdersResult.error,
      todayDeliveredOrdersResult.error,
      uniqueOrderUsersResult.error
    ].filter(Boolean);

    if (errors.length > 0) {
      throw errors[0];
    }

    // Рассчитываем общую выручку из доставленных заказов
    const deliveredOrders = deliveredOrdersResult.data || [];
    const totalRevenue = deliveredOrders.reduce((sum, order) => {
      return sum + parseOrderTotal(order.order_text);
    }, 0);

    // Рассчитываем выручку за сегодня из доставленных заказов
    const todayDeliveredOrders = todayDeliveredOrdersResult.data || [];
    const todayRevenue = todayDeliveredOrders.reduce((sum, order) => {
      return sum + parseOrderTotal(order.order_text);
    }, 0);

    // Рассчитываем средний чек
    const averageOrderValue = deliveredOrders.length > 0 
      ? Math.round(totalRevenue / deliveredOrders.length)
      : 0;

    // Подсчитываем уникальных пользователей, которые делали заказы
    const uniqueOrderUsers = uniqueOrderUsersResult.data || [];
    const uniqueUserTelegramIds = new Set(
      uniqueOrderUsers
        .map((order: any) => order.user_telegram_id)
        .filter((id: any) => id !== null && id !== undefined)
    );
    const uniqueOrderUsersCount = uniqueUserTelegramIds.size;

    // Используем количество уникальных пользователей из заказов, если оно больше
    // Это более точная метрика, так как показывает реальных активных пользователей
    const totalUsers = Math.max(usersResult.count || 0, uniqueOrderUsersCount);

    const stats = {
      totalRestaurants: restaurantsResult.count || 0,
      activeRestaurants: activeRestaurantsResult.count || 0,
      totalOrders: ordersResult.count || 0,
      pendingOrders: pendingOrdersResult.count || 0,
      totalUsers, // Реальные пользователи бота (максимум из users с telegram_id и уникальных из заказов)
      totalBanners: bannersResult.count || 0,
      todayOrders: todayOrdersResult.count || 0,
      todayRevenue,
      totalRevenue,
      averageOrderValue
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
      deliveredOrdersResult,
      todayDeliveredOrdersResult
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
      // Доставленные заказы (для расчета общей выручки)
      supabase
        .from('orders')
        .select('order_text')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'delivered'),
      // Доставленные заказы сегодня
      supabase
        .from('orders')
        .select('order_text')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'delivered')
        .gte('created_at', todayISO)
    ]);

    // Обрабатываем ошибки
    const errors = [
      totalOrdersResult.error,
      pendingOrdersResult.error,
      todayOrdersResult.error,
      deliveredOrdersResult.error,
      todayDeliveredOrdersResult.error
    ].filter(Boolean);

    if (errors.length > 0) {
      throw errors[0];
    }

    // Рассчитываем общую выручку из доставленных заказов
    const deliveredOrders = deliveredOrdersResult.data || [];
    const totalRevenue = deliveredOrders.reduce((sum, order) => {
      return sum + parseOrderTotal(order.order_text);
    }, 0);

    // Рассчитываем выручку за сегодня из доставленных заказов
    const todayDeliveredOrders = todayDeliveredOrdersResult.data || [];
    const todayRevenue = todayDeliveredOrders.reduce((sum, order) => {
      return sum + parseOrderTotal(order.order_text);
    }, 0);

    // Рассчитываем средний чек
    const averageOrderValue = deliveredOrders.length > 0 
      ? Math.round(totalRevenue / deliveredOrders.length)
      : 0;

    const stats = {
      todayOrders: todayOrdersResult.count || 0,
      todayRevenue,
      pendingOrders: pendingOrdersResult.count || 0,
      totalOrders: totalOrdersResult.count || 0,
      totalRevenue,
      averageOrderValue
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

/**
 * GET /api/stats/restaurants
 * Получить статистику по всем ресторанам за месяц
 */
export async function getRestaurantsStats(req: Request, res: Response) {
  try {
    // Получаем начало и конец текущего месяца
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartISO = monthStart.toISOString();
    
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    const monthEndISO = monthEnd.toISOString();

    // Получаем все рестораны
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id, name, is_active')
      .order('name', { ascending: true });

    if (restaurantsError) {
      throw restaurantsError;
    }

    if (!restaurants || restaurants.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Для каждого ресторана получаем статистику за месяц
    const restaurantsStats = await Promise.all(
      restaurants.map(async (restaurant) => {
        // Получаем все заказы ресторана за месяц
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id, order_text, status, created_at')
          .eq('restaurant_id', restaurant.id)
          .gte('created_at', monthStartISO)
          .lte('created_at', monthEndISO);

        if (ordersError) {
          console.error(`Error fetching orders for restaurant ${restaurant.id}:`, ordersError);
          return {
            restaurant_id: restaurant.id,
            restaurant_name: restaurant.name,
            is_active: restaurant.is_active,
            total_orders: 0,
            total_revenue: 0,
            average_order_value: 0
          };
        }

        // Рассчитываем статистику
        const totalOrders = orders?.length || 0;
        
        // Рассчитываем выручку из всех заказов (не только доставленных, так как пользователь может хотеть видеть все)
        const totalRevenue = (orders || []).reduce((sum, order) => {
          return sum + parseOrderTotal(order.order_text);
        }, 0);

        // Средний чек
        const averageOrderValue = totalOrders > 0 
          ? Math.round(totalRevenue / totalOrders)
          : 0;

        return {
          restaurant_id: restaurant.id,
          restaurant_name: restaurant.name,
          is_active: restaurant.is_active,
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          average_order_value: averageOrderValue
        };
      })
    );

    // Сортируем по количеству заказов (по убыванию)
    restaurantsStats.sort((a, b) => b.total_orders - a.total_orders);

    res.json({
      success: true,
      data: restaurantsStats
    });
  } catch (error: any) {
    console.error('Error fetching restaurants stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch restaurants stats',
      message: error.message
    });
  }
}

