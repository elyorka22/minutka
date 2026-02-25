// ============================================
// Store Categories Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/auth';
import { validateString, validateUuid } from '../utils/validation';

export interface StoreCategory {
  id: string;
  restaurant_id: string | null;
  name: string;
  description?: string | null;
  image_url?: string | null;
  display_order: number;
  is_active: boolean;
  display_type?: 'grid' | 'carousel';
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/store-categories
 * Получить категории магазина
 * Query params: restaurant_id (required)
 * Публичный доступ (для активных категорий)
 */
export async function getStoreCategories(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id, include_inactive, all } = req.query;

    let query = supabase
      .from('store_categories')
      .select('*');

    // Если указан restaurant_id, фильтруем по нему
    if (restaurant_id && all !== 'true') {
      query = query.eq('restaurant_id', restaurant_id as string);
    }

    // Если не запрошены неактивные категории, фильтруем только активные
    if (include_inactive !== 'true') {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({ success: true, data: data as StoreCategory[] });
  } catch (error: any) {
    console.error('Error fetching store categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch store categories', message: error.message });
  }
}

/**
 * GET /api/store-categories/:id
 * Получить категорию по ID
 * Публичный доступ
 */
export async function getStoreCategoryById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('store_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Store category not found' });
      }
      throw error;
    }

    res.json({ success: true, data: data as StoreCategory });
  } catch (error: any) {
    console.error('Error fetching store category:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch store category', message: error.message });
  }
}

/**
 * POST /api/store-categories
 * Создать новую категорию
 * Админ ресторана может создавать категории только для своего магазина
 */
export async function createStoreCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id, name, description, image_url, display_order, is_active, display_type, button_text, button_link } = req.body;

    // Версия кода для отладки
    const CODE_VERSION = 'v2.0-null-restaurant-id-support';
    
    console.log(`[createStoreCategory] Code version: ${CODE_VERSION}`);
    console.log('[createStoreCategory] Request body:', JSON.stringify(req.body, null, 2));
    console.log('[createStoreCategory] User:', req.user?.role, req.user?.telegram_id);
    console.log('[createStoreCategory] restaurant_id type:', typeof restaurant_id, 'value:', restaurant_id);
    console.log('[createStoreCategory] restaurant_id in body:', 'restaurant_id' in req.body);
    console.log('[createStoreCategory] Full req.body keys:', Object.keys(req.body));

    // Валидация обязательных полей
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required field: name',
        code_version: CODE_VERSION 
      });
    }
    
    // ВАЖНО: restaurant_id НЕ является обязательным полем для категорий главной страницы
    // Если restaurant_id отсутствует или равен null - это категория главной страницы

    // Нормализуем restaurant_id: 
    // - Если поле отсутствует в запросе (undefined) - это категория главной страницы (null)
    // - Если это null, пустая строка или строка "null" - тоже null
    // - Иначе используем переданное значение
    const normalizedRestaurantId = restaurant_id === undefined || restaurant_id === null || restaurant_id === '' || restaurant_id === 'null' ? null : restaurant_id;

    // Для категорий главной страницы restaurant_id может быть null (только для супер-админов)
    // Для категорий магазинов restaurant_id обязателен
    if (normalizedRestaurantId && !validateUuid(normalizedRestaurantId)) {
      return res.status(400).json({ success: false, error: 'Invalid restaurant_id format' });
    }

    // Если restaurant_id не указан, разрешаем только супер-админам
    if (!normalizedRestaurantId && req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only super admins can create main page categories (without restaurant_id)'
      });
    }

    if (!validateString(name, 1, 255)) {
      return res.status(400).json({ success: false, error: 'Name must be between 1 and 255 characters' });
    }

    if (description && !validateString(description, 0, 1000)) {
      return res.status(400).json({ success: false, error: 'Description must be less than 1000 characters' });
    }

    // Проверка прав доступа
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Супер-админы могут создавать категории для любых магазинов или главной страницы (restaurant_id = null)
    if (req.user.role !== 'super_admin') {
      // Админы ресторана могут создавать категории только для своего магазина (restaurant_id обязателен)
      if (!normalizedRestaurantId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Only super admins can create main page categories (without restaurant_id)'
        });
      }
      
      if (req.user.role === 'restaurant_admin' && req.user.restaurant_id !== normalizedRestaurantId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You can only create store categories for your own store'
        });
      }
      
      // Другие роли не могут создавать категории
      if (req.user.role !== 'restaurant_admin') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Only restaurant admins and super admins can create store categories'
        });
      }
    }

    // Получаем максимальный display_order для установки нового значения
    let maxOrderQuery = supabase
      .from('store_categories')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1);
    
    if (normalizedRestaurantId) {
      maxOrderQuery = maxOrderQuery.eq('restaurant_id', normalizedRestaurantId);
    } else {
      maxOrderQuery = maxOrderQuery.is('restaurant_id', null);
    }
    
    const { data: maxOrderData, error: maxOrderError } = await maxOrderQuery.maybeSingle();
    
    // Игнорируем ошибку, если записей нет (это нормально для первой категории)
    if (maxOrderError && maxOrderError.code !== 'PGRST116') {
      console.error('[createStoreCategory] Error fetching max display_order:', maxOrderError);
    }

    const newDisplayOrder = display_order !== undefined 
      ? display_order 
      : (maxOrderData?.display_order ?? 0) + 1;

    console.log('[createStoreCategory] Inserting category with:', {
      restaurant_id: normalizedRestaurantId,
      name,
      display_order: newDisplayOrder
    });

    const { data, error } = await supabase
      .from('store_categories')
      .insert({
        restaurant_id: normalizedRestaurantId,
        name,
        description: description || null,
        image_url: image_url || null,
        display_order: newDisplayOrder,
        is_active: is_active ?? true,
        display_type: display_type || 'grid',
        button_text: button_text || null,
        button_link: button_link || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[createStoreCategory] Supabase error:', error);
      console.error('[createStoreCategory] Error code:', error.code);
      console.error('[createStoreCategory] Error message:', error.message);
      console.error('[createStoreCategory] Error details:', error.details);
      
      // Проверяем на дубликат имени
      if (error.code === '23505') {
        const errorMessage = normalizedRestaurantId 
          ? 'A category with this name already exists for this store'
          : 'A category with this name already exists on the main page';
        return res.status(400).json({
          success: false,
          error: errorMessage
        });
      }
      
      // Проверяем на нарушение уникального индекса
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        const errorMessage = normalizedRestaurantId 
          ? 'A category with this name already exists for this store'
          : 'A category with this name already exists on the main page';
        return res.status(400).json({
          success: false,
          error: errorMessage
        });
      }
      
      // Возвращаем детальное сообщение об ошибке
      return res.status(400).json({
        success: false,
        error: error.message || 'Failed to create store category',
        details: error.details || error.hint
      });
    }

    res.status(201).json({ success: true, data: data as StoreCategory });
  } catch (error: any) {
    console.error('Error creating store category:', error);
    res.status(500).json({ success: false, error: 'Failed to create store category', message: error.message });
  }
}

/**
 * PATCH /api/store-categories/:id
 * Обновить категорию
 * Админ ресторана может обновлять категории только своего магазина
 */
export async function updateStoreCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, image_url, display_order, is_active, display_type, button_text, button_link } = req.body;

    // Валидация ID
    if (!validateUuid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid store category ID format' });
    }

    // Валидация полей если они переданы
    if (name !== undefined && !validateString(name, 1, 255)) {
      return res.status(400).json({ success: false, error: 'Name must be between 1 and 255 characters' });
    }

    if (description !== undefined && description !== null && !validateString(description, 0, 1000)) {
      return res.status(400).json({ success: false, error: 'Description must be less than 1000 characters' });
    }

    // Проверка прав доступа
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Получаем информацию о категории для проверки restaurant_id
    const { data: category, error: categoryError } = await supabase
      .from('store_categories')
      .select('restaurant_id')
      .eq('id', id)
      .single();

    if (categoryError || !category) {
      return res.status(404).json({
        success: false,
        error: 'Store category not found'
      });
    }

    // Супер-админы могут обновлять категории любых магазинов или главной страницы (restaurant_id = null)
    if (req.user.role !== 'super_admin') {
      // Категории главной страницы (restaurant_id = null) могут обновлять только супер-админы
      if (!category.restaurant_id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Only super admins can update main page categories (without restaurant_id)'
        });
      }
      
      // Админы ресторана могут обновлять категории только своего магазина
      if (req.user.role === 'restaurant_admin' && req.user.restaurant_id !== category.restaurant_id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You can only update store categories of your own store'
        });
      }
      
      // Другие роли не могут обновлять категории
      if (req.user.role !== 'restaurant_admin') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Only restaurant admins and super admins can update store categories'
        });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (display_type !== undefined) updateData.display_type = display_type;
    if (button_text !== undefined) updateData.button_text = button_text || null;
    if (button_link !== undefined) updateData.button_link = button_link || null;

    const { data, error } = await supabase
      .from('store_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Проверяем на дубликат имени
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          error: 'A category with this name already exists for this store'
        });
      }
      throw error;
    }

    res.json({ success: true, data: data as StoreCategory });
  } catch (error: any) {
    console.error('Error updating store category:', error);
    res.status(500).json({ success: false, error: 'Failed to update store category', message: error.message });
  }
}

/**
 * DELETE /api/store-categories/:id
 * Удалить категорию
 * Админ ресторана может удалять категории только своего магазина
 */
export async function deleteStoreCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    // Проверка прав доступа
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Получаем информацию о категории для проверки restaurant_id
    const { data: category, error: categoryError } = await supabase
      .from('store_categories')
      .select('restaurant_id')
      .eq('id', id)
      .single();

    if (categoryError || !category) {
      return res.status(404).json({
        success: false,
        error: 'Store category not found'
      });
    }

    // Супер-админы могут удалять категории любых магазинов или главной страницы (restaurant_id = null)
    if (req.user.role !== 'super_admin') {
      // Категории главной страницы (restaurant_id = null) могут удалять только супер-админы
      if (!category.restaurant_id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Only super admins can delete main page categories (without restaurant_id)'
        });
      }
      
      // Админы ресторана могут удалять категории только своего магазина
      if (req.user.role === 'restaurant_admin' && req.user.restaurant_id !== category.restaurant_id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You can only delete store categories of your own store'
        });
      }
      
      // Другие роли не могут удалять категории
      if (req.user.role !== 'restaurant_admin') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Only restaurant admins and super admins can delete store categories'
        });
      }
    }

    const { error } = await supabase
      .from('store_categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.status(204).json({ success: true, message: 'Store category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting store category:', error);
    res.status(500).json({ success: false, error: 'Failed to delete store category', message: error.message });
  }
}

