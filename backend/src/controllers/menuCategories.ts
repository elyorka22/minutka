// ============================================
// Menu Categories Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/auth';
import { validateString, validateUuid } from '../utils/validation';

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/menu-categories
 * Получить категории меню ресторана
 * Query params: restaurant_id (required)
 * Публичный доступ (для активных категорий)
 */
export async function getMenuCategories(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id, include_inactive } = req.query;

    if (!restaurant_id) {
      return res.status(400).json({ success: false, error: 'restaurant_id is required' });
    }

    let query = supabase
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', restaurant_id);

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

    res.json({ success: true, data: data as MenuCategory[] });
  } catch (error: any) {
    console.error('Error fetching menu categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch menu categories', message: error.message });
  }
}

/**
 * GET /api/menu-categories/:id
 * Получить категорию по ID
 * Публичный доступ
 */
export async function getMenuCategoryById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Menu category not found' });
      }
      throw error;
    }

    res.json({ success: true, data: data as MenuCategory });
  } catch (error: any) {
    console.error('Error fetching menu category:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch menu category', message: error.message });
  }
}

/**
 * POST /api/menu-categories
 * Создать новую категорию
 * Админ ресторана может создавать категории только для своего ресторана
 */
export async function createMenuCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id, name, description, image_url, display_order, is_active } = req.body;

    // Валидация обязательных полей
    if (!restaurant_id || !name) {
      return res.status(400).json({ success: false, error: 'Missing required fields: restaurant_id, name' });
    }

    // Валидация типов и значений
    if (!validateUuid(restaurant_id)) {
      return res.status(400).json({ success: false, error: 'Invalid restaurant_id format' });
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

    // Супер-админы могут создавать категории для любых ресторанов
    if (req.user.role !== 'super_admin') {
      // Админы ресторана могут создавать категории только для своего ресторана
      if (req.user.role === 'restaurant_admin' && req.user.restaurant_id !== restaurant_id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You can only create menu categories for your own restaurant'
        });
      }
      
      // Другие роли не могут создавать категории
      if (req.user.role !== 'restaurant_admin') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Only restaurant admins and super admins can create menu categories'
        });
      }
    }

    // Получаем максимальный display_order для установки нового значения
    const { data: maxOrderData } = await supabase
      .from('menu_categories')
      .select('display_order')
      .eq('restaurant_id', restaurant_id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const newDisplayOrder = display_order !== undefined 
      ? display_order 
      : (maxOrderData?.display_order ?? 0) + 1;

    const { data, error } = await supabase
      .from('menu_categories')
      .insert({
        restaurant_id,
        name,
        description: description || null,
        image_url: image_url || null,
        display_order: newDisplayOrder,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      // Проверяем на дубликат имени
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          error: 'A category with this name already exists for this restaurant'
        });
      }
      throw error;
    }

    res.status(201).json({ success: true, data: data as MenuCategory });
  } catch (error: any) {
    console.error('Error creating menu category:', error);
    res.status(500).json({ success: false, error: 'Failed to create menu category', message: error.message });
  }
}

/**
 * PATCH /api/menu-categories/:id
 * Обновить категорию
 * Админ ресторана может обновлять категории только своего ресторана
 */
export async function updateMenuCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, image_url, display_order, is_active } = req.body;

    // Валидация ID
    if (!validateUuid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid menu category ID format' });
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
      .from('menu_categories')
      .select('restaurant_id')
      .eq('id', id)
      .single();

    if (categoryError || !category) {
      return res.status(404).json({
        success: false,
        error: 'Menu category not found'
      });
    }

    // Супер-админы могут обновлять категории любых ресторанов
    if (req.user.role !== 'super_admin') {
      // Админы ресторана могут обновлять категории только своего ресторана
      if (req.user.role === 'restaurant_admin' && req.user.restaurant_id !== category.restaurant_id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You can only update menu categories of your own restaurant'
        });
      }
      
      // Другие роли не могут обновлять категории
      if (req.user.role !== 'restaurant_admin') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Only restaurant admins and super admins can update menu categories'
        });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('menu_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Проверяем на дубликат имени
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          error: 'A category with this name already exists for this restaurant'
        });
      }
      throw error;
    }

    res.json({ success: true, data: data as MenuCategory });
  } catch (error: any) {
    console.error('Error updating menu category:', error);
    res.status(500).json({ success: false, error: 'Failed to update menu category', message: error.message });
  }
}

/**
 * DELETE /api/menu-categories/:id
 * Удалить категорию
 * Админ ресторана может удалять категории только своего ресторана
 */
export async function deleteMenuCategory(req: AuthenticatedRequest, res: Response) {
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
      .from('menu_categories')
      .select('restaurant_id')
      .eq('id', id)
      .single();

    if (categoryError || !category) {
      return res.status(404).json({
        success: false,
        error: 'Menu category not found'
      });
    }

    // Супер-админы могут удалять категории любых ресторанов
    if (req.user.role !== 'super_admin') {
      // Админы ресторана могут удалять категории только своего ресторана
      if (req.user.role === 'restaurant_admin' && req.user.restaurant_id !== category.restaurant_id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You can only delete menu categories of your own restaurant'
        });
      }
      
      // Другие роли не могут удалять категории
      if (req.user.role !== 'restaurant_admin') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Only restaurant admins and super admins can delete menu categories'
        });
      }
    }

    const { error } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.status(204).json({ success: true, message: 'Menu category deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting menu category:', error);
    res.status(500).json({ success: false, error: 'Failed to delete menu category', message: error.message });
  }
}

