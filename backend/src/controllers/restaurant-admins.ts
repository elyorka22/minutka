// ============================================
// Restaurant Admins Controller
// ============================================

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { RestaurantAdmin } from '../types';

/**
 * GET /api/restaurant-admins
 * Получить список админов ресторана
 * Query params: restaurant_id (optional)
 */
export async function getRestaurantAdmins(req: Request, res: Response) {
  try {
    const { restaurant_id } = req.query;

    let query = supabase
      .from('restaurant_admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (restaurant_id) {
      query = query.eq('restaurant_id', restaurant_id);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({ success: true, data: data as RestaurantAdmin[] });
  } catch (error: any) {
    console.error('Error fetching restaurant admins:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch restaurant admins', message: error.message });
  }
}

/**
 * GET /api/restaurant-admins/:id
 * Получить админа по ID
 */
export async function getRestaurantAdminById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('restaurant_admins')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Restaurant admin not found' });
      }
      throw error;
    }

    res.json({ success: true, data: data as RestaurantAdmin });
  } catch (error: any) {
    console.error('Error fetching restaurant admin:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch restaurant admin', message: error.message });
  }
}

/**
 * POST /api/restaurant-admins
 * Создать нового админа ресторана
 */
export async function createRestaurantAdmin(req: Request, res: Response) {
  try {
    const { restaurant_id, telegram_id, username, first_name, last_name, phone, is_active, password } = req.body;

    if (!restaurant_id || !telegram_id) {
      return res.status(400).json({ success: false, error: 'Missing required fields: restaurant_id, telegram_id' });
    }

    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required for restaurant admins' });
    }

    const { data, error } = await supabase
      .from('restaurant_admins')
      .insert({
        restaurant_id,
        telegram_id,
        username: username || null,
        first_name: first_name || null,
        last_name: last_name || null,
        phone: phone || null,
        is_active: is_active ?? true,
        password: password, // Сохраняем пароль
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ success: true, data: data as RestaurantAdmin });
  } catch (error: any) {
    console.error('Error creating restaurant admin:', error);
    res.status(500).json({ success: false, error: 'Failed to create restaurant admin', message: error.message });
  }
}

/**
 * PATCH /api/restaurant-admins/:id
 * Обновить админа ресторана
 */
export async function updateRestaurantAdmin(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { username, first_name, last_name, phone, is_active } = req.body;

    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (phone !== undefined) updateData.phone = phone;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('restaurant_admins')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({ success: true, data: data as RestaurantAdmin });
  } catch (error: any) {
    console.error('Error updating restaurant admin:', error);
    res.status(500).json({ success: false, error: 'Failed to update restaurant admin', message: error.message });
  }
}

/**
 * DELETE /api/restaurant-admins/:id
 * Удалить админа ресторана
 */
export async function deleteRestaurantAdmin(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('restaurant_admins')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.status(204).json({ success: true, message: 'Restaurant admin deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting restaurant admin:', error);
    res.status(500).json({ success: false, error: 'Failed to delete restaurant admin', message: error.message });
  }
}


