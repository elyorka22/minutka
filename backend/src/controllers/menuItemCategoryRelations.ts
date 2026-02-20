// ============================================
// Menu Item Category Relations Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * GET /api/menu-items/:menuItemId/categories
 * Получить категории товара
 */
export async function getMenuItemCategories(req: AuthenticatedRequest, res: Response) {
  try {
    const { menuItemId } = req.params;

    const { data, error } = await supabase
      .from('menu_item_category_relations')
      .select('category_name')
      .eq('menu_item_id', menuItemId);

    if (error) {
      throw error;
    }

    const categories = (data || []).map((rel: any) => rel.category_name);

    res.json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    console.error('Error fetching menu item categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu item categories',
      message: error.message
    });
  }
}

/**
 * POST /api/menu-items/:menuItemId/categories
 * Установить категории для товара
 */
export async function setMenuItemCategories(req: AuthenticatedRequest, res: Response) {
  try {
    const { menuItemId } = req.params;
    const { categories } = req.body; // Массив названий категорий

    if (!Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        error: 'categories must be an array'
      });
    }

    // Удаляем все существующие связи
    const { error: deleteError } = await supabase
      .from('menu_item_category_relations')
      .delete()
      .eq('menu_item_id', menuItemId);

    if (deleteError) {
      throw deleteError;
    }

    // Создаем новые связи
    if (categories.length > 0) {
      const relations = categories.map((categoryName: string) => ({
        menu_item_id: menuItemId,
        category_name: categoryName
      }));

      const { error: insertError } = await supabase
        .from('menu_item_category_relations')
        .insert(relations);

      if (insertError) {
        throw insertError;
      }
    }

    res.json({
      success: true,
      message: 'Categories updated successfully'
    });
  } catch (error: any) {
    console.error('Error setting menu item categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set menu item categories',
      message: error.message
    });
  }
}

/**
 * GET /api/categories/:categoryName/menu-items
 * Получить товары по категории (из таблицы связей)
 */
export async function getMenuItemsByCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const { categoryName } = req.params;
    const { include_unavailable } = req.query;

    // Получаем ID товаров, связанных с этой категорией
    const { data: relations, error: relationsError } = await supabase
      .from('menu_item_category_relations')
      .select('menu_item_id')
      .eq('category_name', categoryName);

    if (relationsError) {
      throw relationsError;
    }

    if (!relations || relations.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const menuItemIds = relations.map((rel: any) => rel.menu_item_id);

    // Получаем товары
    let query = supabase
      .from('menu_items')
      .select('*')
      .in('id', menuItemIds)
      .eq('is_banner', false);

    if (include_unavailable !== 'true') {
      query = query.eq('is_available', true);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Error fetching menu items by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu items by category',
      message: error.message
    });
  }
}

