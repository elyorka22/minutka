// ============================================
// Menu Items Controller
// ============================================

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { MenuItem } from '../types';

/**
 * GET /api/menu
 * Получить меню ресторана
 * Query params: restaurant_id (required)
 */
export async function getMenuItems(req: Request, res: Response) {
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
 */
export async function getMenuItemById(req: Request, res: Response) {
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
 */
export async function createMenuItem(req: Request, res: Response) {
  try {
    const { restaurant_id, name, description, price, category, image_url, is_available } = req.body;

    if (!restaurant_id || !name || price === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields: restaurant_id, name, price' });
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
 */
export async function updateMenuItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, price, category, image_url, is_available } = req.body;

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
 */
export async function deleteMenuItem(req: Request, res: Response) {
  try {
    const { id } = req.params;

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


