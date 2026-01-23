// ============================================
// Restaurant Categories Controller
// ============================================

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * Получить все категории
 */
export async function getCategories(req: Request, res: Response) {
  try {
    const { active } = req.query;
    
    let query = supabase
      .from('restaurant_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (active === 'true') {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }

    res.json({ data });
  } catch (error: any) {
    console.error('Error in getCategories:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Получить категорию по ID
 */
export async function getCategoryById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('restaurant_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching category:', error);
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ data });
  } catch (error: any) {
    console.error('Error in getCategoryById:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Создать новую категорию
 */
export async function createCategory(req: Request, res: Response) {
  try {
    const { name, image_url, display_order, is_active } = req.body;

    if (!name || !image_url) {
      return res.status(400).json({ error: 'Name and image_url are required' });
    }

    const { data, error } = await supabase
      .from('restaurant_categories')
      .insert({
        name,
        image_url,
        display_order: display_order || 0,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return res.status(500).json({ error: 'Failed to create category' });
    }

    res.status(201).json({ data });
  } catch (error: any) {
    console.error('Error in createCategory:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Обновить категорию
 */
export async function updateCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, image_url, display_order, is_active } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('restaurant_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return res.status(500).json({ error: 'Failed to update category' });
    }

    res.json({ data });
  } catch (error: any) {
    console.error('Error in updateCategory:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Удалить категорию
 */
export async function deleteCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('restaurant_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return res.status(500).json({ error: 'Failed to delete category' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Error in deleteCategory:', error);
    res.status(500).json({ error: error.message });
  }
}



