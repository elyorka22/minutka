// ============================================
// Menu Items Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { MenuItem } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';
import { validatePrice, validateString, validateUrl, validateUuid } from '../utils/validation';

/**
 * GET /api/menu
 * Получить меню ресторана
 * Query params: restaurant_id (required)
 * Публичный доступ
 */
export async function getMenuItems(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id, include_unavailable } = req.query;

    if (!restaurant_id) {
      return res.status(400).json({ success: false, error: 'restaurant_id is required' });
    }

    let query = supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurant_id);

    // Если не запрошены недоступные блюда, фильтруем только доступные
    if (include_unavailable !== 'true') {
      query = query.eq('is_available', true);
    }

    const { data, error } = await query
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({ success: true, data: data as MenuItem[] });
  } catch (error: any) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch menu items', message: error.message });
  }
}

/**
 * GET /api/menu/:id
 * Получить блюдо по ID
 * Публичный доступ
 */
export async function getMenuItemById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Menu item not found' });
      }
      throw error;
    }

    res.json({ success: true, data: data as MenuItem });
  } catch (error: any) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch menu item', message: error.message });
  }
}

/**
 * POST /api/menu
 * Создать новое блюдо
 * Админ ресторана может создавать блюда только для своего ресторана
 */
export async function createMenuItem(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id, name, description, price, category, image_url, is_available } = req.body;

    // Валидация обязательных полей
    if (!restaurant_id || !name || price === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields: restaurant_id, name, price' });
    }

    // Валидация типов и значений
    if (!validateUuid(restaurant_id)) {
      return res.status(400).json({ success: false, error: 'Invalid restaurant_id format' });
    }

    if (!validateString(name, 1, 255)) {
      return res.status(400).json({ success: false, error: 'Name must be between 1 and 255 characters' });
    }

    if (!validatePrice(price)) {
      return res.status(400).json({ success: false, error: 'Price must be a positive number' });
    }

    if (description && !validateString(description, 0, 2000)) {
      return res.status(400).json({ success: false, error: 'Description must be less than 2000 characters' });
    }

    if (category && !validateString(category, 1, 100)) {
      return res.status(400).json({ success: false, error: 'Category must be between 1 and 100 characters' });
    }

    if (image_url && !validateUrl(image_url)) {
      return res.status(400).json({ success: false, error: 'Invalid image URL format' });
    }

    // Проверка прав доступа
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Супер-админы могут создавать блюда для любых ресторанов
    if (req.user.role !== 'super_admin') {
      // Админы ресторана могут создавать блюда только для своего ресторана
      if (req.user.role === 'restaurant_admin' && req.user.restaurant_id !== restaurant_id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You can only create menu items for your own restaurant'
        });
      }
      
      // Повары не могут создавать блюда
      if (req.user.role === 'chef') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Chefs cannot create menu items'
        });
      }
    }

    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        restaurant_id,
        name,
        description: description || null,
        price,
        category: category || null, // Категория опциональна
        image_url: image_url || null,
        is_available: is_available ?? true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ success: true, data: data as MenuItem });
  } catch (error: any) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ success: false, error: 'Failed to create menu item', message: error.message });
  }
}

/**
 * PATCH /api/menu/:id
 * Обновить блюдо
 * Админ ресторана может обновлять блюда только своего ресторана
 */
export async function updateMenuItem(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, price, category, image_url, is_available } = req.body;

    // Валидация ID
    if (!validateUuid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid menu item ID format' });
    }

    // Валидация полей если они переданы
    if (name !== undefined && !validateString(name, 1, 255)) {
      return res.status(400).json({ success: false, error: 'Name must be between 1 and 255 characters' });
    }

    if (description !== undefined && description !== null && !validateString(description, 0, 2000)) {
      return res.status(400).json({ success: false, error: 'Description must be less than 2000 characters' });
    }

    if (price !== undefined && !validatePrice(price)) {
      return res.status(400).json({ success: false, error: 'Price must be a positive number' });
    }

    if (category !== undefined && category !== null && !validateString(category, 1, 100)) {
      return res.status(400).json({ success: false, error: 'Category must be between 1 and 100 characters' });
    }

    if (image_url !== undefined && image_url !== null && !validateUrl(image_url)) {
      return res.status(400).json({ success: false, error: 'Invalid image URL format' });
    }

    // Проверка прав доступа
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Получаем информацию о блюде для проверки restaurant_id
    const { data: menuItem, error: menuItemError } = await supabase
      .from('menu_items')
      .select('restaurant_id')
      .eq('id', id)
      .single();

    if (menuItemError || !menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    // Логируем информацию для отладки
    console.log('updateMenuItem - Authorization check:', {
      userId: req.user?.telegram_id,
      userRole: req.user?.role,
      userRestaurantId: req.user?.restaurant_id,
      menuItemRestaurantId: menuItem.restaurant_id,
      menuItemId: id
    });

    // Супер-админы могут обновлять блюда любых ресторанов
    if (req.user.role !== 'super_admin') {
      // Админы ресторана могут обновлять блюда только своего ресторана
      if (req.user.role === 'restaurant_admin') {
        // Проверяем, что restaurant_id установлен
        if (!req.user.restaurant_id) {
          console.error('Restaurant admin has no restaurant_id:', {
            telegramId: req.user.telegram_id,
            userData: req.user.userData
          });
          return res.status(403).json({
            success: false,
            error: 'Forbidden: Restaurant admin has no restaurant_id assigned'
          });
        }

        // Приводим к строкам в нижнем регистре для сравнения, так как UUID могут быть в разных форматах
        const userRestaurantId = String(req.user.restaurant_id || '').trim().toLowerCase();
        const itemRestaurantId = String(menuItem.restaurant_id || '').trim().toLowerCase();
        
        console.log('Comparing restaurant IDs:', {
          userRestaurantId,
          itemRestaurantId,
          areEqual: userRestaurantId === itemRestaurantId,
          userRestaurantIdLength: userRestaurantId.length,
          itemRestaurantIdLength: itemRestaurantId.length,
          userRole: req.user.role,
          menuItemId: id,
          userTelegramId: req.user.telegram_id
        });
        
        if (userRestaurantId !== itemRestaurantId) {
          console.error('Restaurant ID mismatch - Access denied:', {
            userRestaurantId,
            itemRestaurantId,
            userRole: req.user.role,
            menuItemId: id,
            userTelegramId: req.user.telegram_id
          });
          return res.status(403).json({
            success: false,
            error: 'Forbidden: You can only update menu items of your own restaurant',
            details: {
              userRestaurantId,
              itemRestaurantId
            }
          });
        }
        
        console.log('Restaurant ID match - Access granted');
      }
      
      // Повары не могут обновлять блюда
      if (req.user.role === 'chef') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Chefs cannot update menu items'
        });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (category !== undefined) updateData.category = category;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (is_available !== undefined) updateData.is_available = is_available;

    const { data, error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({ success: true, data: data as MenuItem });
  } catch (error: any) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ success: false, error: 'Failed to update menu item', message: error.message });
  }
}

/**
 * DELETE /api/menu/:id
 * Удалить блюдо
 * Админ ресторана может удалять блюда только своего ресторана
 */
export async function deleteMenuItem(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    // Проверка прав доступа
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Получаем информацию о блюде для проверки restaurant_id
    const { data: menuItem, error: menuItemError } = await supabase
      .from('menu_items')
      .select('restaurant_id')
      .eq('id', id)
      .single();

    if (menuItemError || !menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    // Супер-админы могут удалять блюда любых ресторанов
    if (req.user.role !== 'super_admin') {
      // Админы ресторана могут удалять блюда только своего ресторана
      if (req.user.role === 'restaurant_admin' && req.user.restaurant_id !== menuItem.restaurant_id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You can only delete menu items of your own restaurant'
        });
      }
      
      // Повары не могут удалять блюда
      if (req.user.role === 'chef') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Chefs cannot delete menu items'
        });
      }
    }

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.status(204).json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ success: false, error: 'Failed to delete menu item', message: error.message });
  }
}


