// ============================================
// Menu Views Controller - Статистика просмотров меню
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * POST /api/menu-views
 * Отслеживание просмотра меню ресторана
 * Публичный доступ
 */
export async function trackMenuView(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id, user_agent, referer, telegram_user_id } = req.body;

    // Валидация
    if (!restaurant_id) {
      return res.status(400).json({
        success: false,
        error: 'restaurant_id is required'
      });
    }

    // Проверяем, что ресторан существует и активен
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, is_active')
      .eq('id', restaurant_id)
      .single();

    if (restaurantError || !restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    if (!restaurant.is_active) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant is not active'
      });
    }

    // Получаем IP адрес из запроса
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Сохраняем просмотр
    const { error: insertError } = await supabase
      .from('menu_views')
      .insert({
        restaurant_id,
        user_agent: user_agent || null,
        referer: referer || null,
        ip_address: ipAddress || null,
        telegram_user_id: telegram_user_id ? BigInt(telegram_user_id) : null,
      });

    if (insertError) {
      console.error('Error inserting menu view:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Failed to track menu view'
      });
    }

    res.json({
      success: true,
      message: 'Menu view tracked successfully'
    });
  } catch (error: any) {
    console.error('Error tracking menu view:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track menu view',
      message: error.message
    });
  }
}

/**
 * GET /api/menu-views/statistics
 * Получить статистику просмотров меню
 * Требует аутентификации (админ ресторана или супер-админ)
 */
export async function getMenuViewStatistics(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id, start_date, end_date } = req.query;

    if (!restaurant_id) {
      return res.status(400).json({
        success: false,
        error: 'restaurant_id is required'
      });
    }

    // Проверка прав доступа
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Админы ресторана могут видеть статистику только своего ресторана
    if (req.user.role === 'restaurant_admin' && req.user.restaurant_id !== restaurant_id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You can only view statistics for your own restaurant'
      });
    }

    // Супер-админы могут видеть статистику любого ресторана
    if (req.user.role !== 'super_admin' && req.user.role !== 'restaurant_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only restaurant admins and super admins can view statistics'
      });
    }

    // Строим запрос
    let query = supabase
      .from('menu_views')
      .select('*')
      .eq('restaurant_id', restaurant_id as string);

    // Фильтр по дате
    if (start_date) {
      query = query.gte('viewed_at', start_date as string);
    }
    if (end_date) {
      query = query.lte('viewed_at', end_date as string);
    }

    // Сортируем по дате (новые сначала)
    query = query.order('viewed_at', { ascending: false });

    const { data: views, error } = await query;

    if (error) {
      throw error;
    }

    // Вычисляем статистику
    const totalViews = views?.length || 0;
    const uniqueUsers = new Set(views?.map((v: any) => v.telegram_user_id).filter(Boolean)).size;
    const viewsByDay: { [key: string]: number } = {};

    views?.forEach((view: any) => {
      const date = new Date(view.viewed_at).toISOString().split('T')[0];
      viewsByDay[date] = (viewsByDay[date] || 0) + 1;
    });

    // Последние 7 дней
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const last7DaysViews = last7Days.map(date => ({
      date,
      views: viewsByDay[date] || 0
    }));

    res.json({
      success: true,
      data: {
        total_views: totalViews,
        unique_users: uniqueUsers,
        views_by_day: viewsByDay,
        last_7_days: last7DaysViews,
        recent_views: views?.slice(0, 50) || [] // Последние 50 просмотров
      }
    });
  } catch (error: any) {
    console.error('Error fetching menu view statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
}

