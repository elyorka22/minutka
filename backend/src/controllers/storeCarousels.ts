// ============================================
// Store Carousels Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/auth';

export interface StoreCarousel {
  id: string;
  restaurant_id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreCarouselItem {
  id: string;
  carousel_id: string;
  menu_item_id: string;
  display_order: number;
  created_at: string;
}

/**
 * GET /api/store-carousels
 * Получить карусели магазина
 * Query params: restaurant_id (required)
 */
export async function getStoreCarousels(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id, include_inactive } = req.query;

    if (!restaurant_id) {
      return res.status(400).json({ success: false, error: 'restaurant_id is required' });
    }

    let query = supabase
      .from('store_carousels')
      .select('*')
      .eq('restaurant_id', restaurant_id);

    if (include_inactive !== 'true') {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({ success: true, data: data as StoreCarousel[] });
  } catch (error: any) {
    console.error('Error fetching store carousels:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch store carousels', message: error.message });
  }
}

/**
 * GET /api/store-carousels/:id
 * Получить карусель по ID
 */
export async function getStoreCarouselById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('store_carousels')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Store carousel not found' });
      }
      throw error;
    }

    res.json({ success: true, data: data as StoreCarousel });
  } catch (error: any) {
    console.error('Error fetching store carousel:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch store carousel', message: error.message });
  }
}

/**
 * POST /api/store-carousels
 * Создать карусель
 */
export async function createStoreCarousel(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id, name, display_order, is_active } = req.body;

    if (!restaurant_id || !name) {
      return res.status(400).json({ success: false, error: 'restaurant_id and name are required' });
    }

    // Только супер-админы могут создавать карусели
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only super admins can create store carousels'
      });
    }

    // Получаем максимальный display_order
    const { data: maxOrderData } = await supabase
      .from('store_carousels')
      .select('display_order')
      .eq('restaurant_id', restaurant_id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const newDisplayOrder = display_order !== undefined 
      ? display_order 
      : (maxOrderData?.display_order ?? 0) + 1;

    const { data, error } = await supabase
      .from('store_carousels')
      .insert({
        restaurant_id,
        name,
        display_order: newDisplayOrder,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          error: 'A carousel with this name already exists for this store'
        });
      }
      throw error;
    }

    res.json({ success: true, data: data as StoreCarousel });
  } catch (error: any) {
    console.error('Error creating store carousel:', error);
    res.status(500).json({ success: false, error: 'Failed to create store carousel', message: error.message });
  }
}

/**
 * PATCH /api/store-carousels/:id
 * Обновить карусель
 */
export async function updateStoreCarousel(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, display_order, is_active } = req.body;

    // Только супер-админы могут обновлять карусели
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only super admins can update store carousels'
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('store_carousels')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Store carousel not found'
        });
      }
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          error: 'A carousel with this name already exists for this store'
        });
      }
      throw error;
    }

    res.json({ success: true, data: data as StoreCarousel });
  } catch (error: any) {
    console.error('Error updating store carousel:', error);
    res.status(500).json({ success: false, error: 'Failed to update store carousel', message: error.message });
  }
}

/**
 * DELETE /api/store-carousels/:id
 * Удалить карусель
 */
export async function deleteStoreCarousel(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    // Только супер-админы могут удалять карусели
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only super admins can delete store carousels'
      });
    }

    const { error } = await supabase
      .from('store_carousels')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({ success: true, message: 'Store carousel deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting store carousel:', error);
    res.status(500).json({ success: false, error: 'Failed to delete store carousel', message: error.message });
  }
}

/**
 * GET /api/store-carousels/:id/items
 * Получить товары карусели
 */
export async function getStoreCarouselItems(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('store_carousel_items')
      .select(`
        *,
        menu_items (*)
      `)
      .eq('carousel_id', id)
      .order('display_order', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({ success: true, data: data as any[] });
  } catch (error: any) {
    console.error('Error fetching store carousel items:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch store carousel items', message: error.message });
  }
}

/**
 * POST /api/store-carousels/:id/items
 * Добавить товары в карусель
 */
export async function addStoreCarouselItems(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { menu_item_ids } = req.body;

    // Только супер-админы могут добавлять товары в карусели
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only super admins can add items to store carousels'
      });
    }

    if (!Array.isArray(menu_item_ids) || menu_item_ids.length === 0) {
      return res.status(400).json({ success: false, error: 'menu_item_ids must be a non-empty array' });
    }

    // Получаем текущий максимальный display_order
    const { data: maxOrderData } = await supabase
      .from('store_carousel_items')
      .select('display_order')
      .eq('carousel_id', id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    let currentOrder = (maxOrderData?.display_order ?? -1) + 1;

    // Подготавливаем данные для вставки
    const itemsToInsert = menu_item_ids.map((menu_item_id: string) => ({
      carousel_id: id,
      menu_item_id,
      display_order: currentOrder++,
    }));

    const { data, error } = await supabase
      .from('store_carousel_items')
      .insert(itemsToInsert)
      .select();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          error: 'Some items are already in this carousel'
        });
      }
      throw error;
    }

    res.json({ success: true, data: data as StoreCarouselItem[] });
  } catch (error: any) {
    console.error('Error adding store carousel items:', error);
    res.status(500).json({ success: false, error: 'Failed to add store carousel items', message: error.message });
  }
}

/**
 * DELETE /api/store-carousels/:id/items/:item_id
 * Удалить товар из карусели
 */
export async function removeStoreCarouselItem(req: AuthenticatedRequest, res: Response) {
  try {
    const { id, item_id } = req.params;

    // Только супер-админы могут удалять товары из каруселей
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only super admins can remove items from store carousels'
      });
    }

    const { error } = await supabase
      .from('store_carousel_items')
      .delete()
      .eq('carousel_id', id)
      .eq('menu_item_id', item_id);

    if (error) {
      throw error;
    }

    res.json({ success: true, message: 'Item removed from carousel successfully' });
  } catch (error: any) {
    console.error('Error removing store carousel item:', error);
    res.status(500).json({ success: false, error: 'Failed to remove store carousel item', message: error.message });
  }
}

/**
 * PUT /api/store-carousels/:id/items
 * Обновить порядок товаров в карусели
 */
export async function updateStoreCarouselItemsOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { items } = req.body; // Array of { menu_item_id, display_order }

    // Только супер-админы могут обновлять порядок товаров
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only super admins can update carousel items order'
      });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'items must be an array' });
    }

    // Обновляем порядок для каждого товара
    const updatePromises = items.map((item: { menu_item_id: string; display_order: number }) =>
      supabase
        .from('store_carousel_items')
        .update({ display_order: item.display_order })
        .eq('carousel_id', id)
        .eq('menu_item_id', item.menu_item_id)
    );

    await Promise.all(updatePromises);

    res.json({ success: true, message: 'Carousel items order updated successfully' });
  } catch (error: any) {
    console.error('Error updating store carousel items order:', error);
    res.status(500).json({ success: false, error: 'Failed to update store carousel items order', message: error.message });
  }
}

