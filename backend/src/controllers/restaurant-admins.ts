// ============================================
// Restaurant Admins Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { RestaurantAdmin } from '../types';
import { hashPassword, isHashed } from '../utils/password';
import { validateTelegramId, validatePassword, validateString, validateUuid, validatePhone } from '../utils/validation';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * GET /api/restaurant-admins
 * Получить список админов ресторана
 * Query params: restaurant_id (optional)
 */
export async function getRestaurantAdmins(req: AuthenticatedRequest, res: Response) {
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
 * GET /api/restaurant-admins/my-restaurants
 * Получить все рестораны админа по telegram_id
 * Query params: telegram_id (required)
 */
export async function getMyRestaurants(req: AuthenticatedRequest, res: Response) {
  try {
    const { telegram_id } = req.query;

    if (!telegram_id) {
      return res.status(400).json({ success: false, error: 'telegram_id is required' });
    }

    const telegramId = BigInt(telegram_id as string);

    // Получаем все записи админа с информацией о ресторанах
    const { data: adminRecords, error: adminError } = await supabase
      .from('restaurant_admins')
      .select(`
        id,
        restaurant_id,
        is_active,
        created_at,
        restaurants (
          id,
          name,
          description,
          image_url,
          is_active,
          is_featured
        )
      `)
      .eq('telegram_id', telegramId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (adminError) {
      throw adminError;
    }

    // Формируем список ресторанов
    const restaurants = (adminRecords || [])
      .filter((record: any) => record.restaurants && record.restaurants.is_active)
      .map((record: any) => ({
        restaurant_id: record.restaurant_id,
        admin_id: record.id,
        restaurant: record.restaurants
      }));

    res.json({ success: true, data: restaurants });
  } catch (error: any) {
    console.error('Error fetching my restaurants:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch restaurants', message: error.message });
  }
}

/**
 * GET /api/restaurant-admins/:id
 * Получить админа по ID
 */
export async function getRestaurantAdminById(req: AuthenticatedRequest, res: Response) {
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
export async function createRestaurantAdmin(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id, telegram_id, username, first_name, last_name, phone, is_active, password } = req.body;

    // Валидация обязательных полей
    if (!restaurant_id || !telegram_id) {
      return res.status(400).json({ success: false, error: 'Missing required fields: restaurant_id, telegram_id' });
    }

    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required for restaurant admins' });
    }

    // Валидация форматов
    if (!validateUuid(restaurant_id)) {
      return res.status(400).json({ success: false, error: 'Invalid restaurant_id format' });
    }

    if (!validateTelegramId(telegram_id)) {
      return res.status(400).json({ success: false, error: 'Invalid telegram_id format' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
    }

    if (phone !== undefined && phone !== null && !validatePhone(phone)) {
      return res.status(400).json({ success: false, error: 'Invalid phone number format' });
    }

    if (username !== undefined && username !== null && !validateString(username, 1, 100)) {
      return res.status(400).json({ success: false, error: 'Username must be between 1 and 100 characters' });
    }

    if (first_name !== undefined && first_name !== null && !validateString(first_name, 1, 100)) {
      return res.status(400).json({ success: false, error: 'First name must be between 1 and 100 characters' });
    }

    if (last_name !== undefined && last_name !== null && !validateString(last_name, 1, 100)) {
      return res.status(400).json({ success: false, error: 'Last name must be between 1 and 100 characters' });
    }

    // Хешируем пароль
    const hashedPassword = await hashPassword(password);

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
        password: hashedPassword,
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
export async function updateRestaurantAdmin(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { username, first_name, last_name, phone, is_active, password, notifications_enabled } = req.body;

    console.log(`Updating restaurant admin ${id} with data:`, {
      username,
      first_name,
      last_name,
      phone,
      is_active,
      notifications_enabled,
      hasPassword: !!password
    });

    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (phone !== undefined) updateData.phone = phone;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (notifications_enabled !== undefined) {
      updateData.notifications_enabled = notifications_enabled;
      console.log(`Setting notifications_enabled to ${notifications_enabled} for admin ${id}`);
    }
    if (password !== undefined && password !== '') {
      // Хешируем пароль только если он еще не хеширован
      updateData.password = isHashed(password) ? password : await hashPassword(password);
    }

    console.log('Update data:', updateData);

    const { data, error } = await supabase
      .from('restaurant_admins')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating restaurant admin:', error);
      throw error;
    }

    console.log('Successfully updated restaurant admin:', data);
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
export async function deleteRestaurantAdmin(req: AuthenticatedRequest, res: Response) {
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


