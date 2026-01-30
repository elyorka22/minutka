// ============================================
// Restaurant-Category Relations Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/auth';
import { validateUuid } from '../utils/validation';
import { Logger } from '../services/logger';

/**
 * GET /api/restaurant-category-relations
 * Получить все связи ресторанов с категориями
 * Query params: restaurant_id, category_id
 */
export async function getRestaurantCategoryRelations(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id, category_id } = req.query;

    let query = supabase
      .from('restaurant_category_relations')
      .select(`
        *,
        restaurants(id, name, image_url),
        restaurant_categories(id, name, image_url)
      `);

    if (restaurant_id) {
      if (!validateUuid(restaurant_id as string)) {
        return res.status(400).json({ success: false, error: 'Invalid restaurant_id format' });
      }
      query = query.eq('restaurant_id', restaurant_id);
    }

    if (category_id) {
      if (!validateUuid(category_id as string)) {
        return res.status(400).json({ success: false, error: 'Invalid category_id format' });
      }
      query = query.eq('category_id', category_id);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Добавляем заголовки кеширования для публичных данных (кеш на 2 минуты)
    res.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
    
    res.json({ success: true, data });
  } catch (error: any) {
    Logger.error('Error fetching restaurant-category relations', error, { userId: req.user?.telegram_id, userRole: req.user?.role, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to fetch relations', message: error.message });
  }
}

/**
 * POST /api/restaurant-category-relations
 * Создать связь между рестораном и категорией
 */
export async function createRestaurantCategoryRelation(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id, category_id } = req.body;

    // Валидация
    if (!validateUuid(restaurant_id)) {
      return res.status(400).json({ success: false, error: 'Invalid restaurant_id format' });
    }

    if (!validateUuid(category_id)) {
      return res.status(400).json({ success: false, error: 'Invalid category_id format' });
    }

    // Проверяем, существует ли ресторан
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('id', restaurant_id)
      .single();

    if (restaurantError || !restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    // Проверяем, существует ли категория
    const { data: category, error: categoryError } = await supabase
      .from('restaurant_categories')
      .select('id')
      .eq('id', category_id)
      .single();

    if (categoryError || !category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    // Создаем связь
    const { data, error } = await supabase
      .from('restaurant_category_relations')
      .insert({
        restaurant_id,
        category_id,
      })
      .select(`
        *,
        restaurants(id, name, image_url),
        restaurant_categories(id, name, image_url)
      `)
      .single();

    if (error) {
      // Если связь уже существует, возвращаем существующую
      if (error.code === '23505') { // Unique violation
        const { data: existing } = await supabase
          .from('restaurant_category_relations')
          .select(`
            *,
            restaurants(id, name, image_url),
            restaurant_categories(id, name, image_url)
          `)
          .eq('restaurant_id', restaurant_id)
          .eq('category_id', category_id)
          .single();

        if (existing) {
          Logger.logCreate('restaurant_category_relation', existing.id, req.user?.telegram_id, req.user?.role, req.ip);
          return res.json({ success: true, data: existing });
        }
      }
      throw error;
    }

    Logger.logCreate('restaurant_category_relation', data.id, req.user?.telegram_id, req.user?.role, req.ip);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    Logger.error('Error creating restaurant-category relation', error, { userId: req.user?.telegram_id, userRole: req.user?.role, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to create relation', message: error.message });
  }
}

/**
 * DELETE /api/restaurant-category-relations/:id
 * Удалить связь между рестораном и категорией
 */
export async function deleteRestaurantCategoryRelation(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!validateUuid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid id format' });
    }

    const { error } = await supabase
      .from('restaurant_category_relations')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    Logger.logDelete('restaurant_category_relation', id, req.user?.telegram_id, req.user?.role, req.ip);
    res.json({ success: true, message: 'Relation deleted successfully' });
  } catch (error: any) {
    Logger.error('Error deleting restaurant-category relation', error, { userId: req.user?.telegram_id, userRole: req.user?.role, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to delete relation', message: error.message });
  }
}

/**
 * DELETE /api/restaurant-category-relations
 * Удалить связь по restaurant_id и category_id
 */
export async function deleteRestaurantCategoryRelationByIds(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id, category_id } = req.body;

    if (!validateUuid(restaurant_id)) {
      return res.status(400).json({ success: false, error: 'Invalid restaurant_id format' });
    }

    if (!validateUuid(category_id)) {
      return res.status(400).json({ success: false, error: 'Invalid category_id format' });
    }

    const { data, error } = await supabase
      .from('restaurant_category_relations')
      .delete()
      .eq('restaurant_id', restaurant_id)
      .eq('category_id', category_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      Logger.logDelete('restaurant_category_relation', data.id, req.user?.telegram_id, req.user?.role, req.ip);
    }
    res.json({ success: true, message: 'Relation deleted successfully' });
  } catch (error: any) {
    Logger.error('Error deleting restaurant-category relation by ids', error, { userId: req.user?.telegram_id, userRole: req.user?.role, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to delete relation', message: error.message });
  }
}

