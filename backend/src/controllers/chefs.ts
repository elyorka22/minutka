// ============================================
// Chefs Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { Chef } from '../types';
import { hashPassword, isHashed } from '../utils/password';
import { validateTelegramId, validatePassword, validateString, validateUuid } from '../utils/validation';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * GET /api/chefs
 * Получить всех поваров (с фильтрацией по ресторану)
 * Query params: restaurant_id (optional)
 */
export async function getChefs(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id } = req.query;

    let query = supabase
      .from('chefs')
      .select('*')
      .order('created_at', { ascending: false });

    if (restaurant_id) {
      query = query.eq('restaurant_id', restaurant_id);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data as Chef[]
    });
  } catch (error: any) {
    console.error('Error fetching chefs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chefs',
      message: error.message
    });
  }
}

/**
 * GET /api/chefs/:id
 * Получить повара по ID
 */
export async function getChefById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('chefs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Chef not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: data as Chef
    });
  } catch (error: any) {
    console.error('Error fetching chef:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chef',
      message: error.message
    });
  }
}

/**
 * POST /api/chefs
 * Создать нового повара
 * Body: {
 *   restaurant_id: string,
 *   telegram_id: number,
 *   telegram_chat_id: number,
 *   username?: string,
 *   first_name?: string,
 *   last_name?: string,
 *   is_active?: boolean
 * }
 */
export async function createChef(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id, telegram_id, telegram_chat_id, username, first_name, last_name, is_active = true, password } = req.body;

    // Валидация обязательных полей
    if (!restaurant_id || !telegram_id || !telegram_chat_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: restaurant_id, telegram_id, telegram_chat_id'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required for chefs'
      });
    }

    // Валидация форматов
    if (!validateUuid(restaurant_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid restaurant_id format'
      });
    }

    if (!validateTelegramId(telegram_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid telegram_id format'
      });
    }

    if (!validateTelegramId(telegram_chat_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid telegram_chat_id format'
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    if (username !== undefined && username !== null && !validateString(username, 1, 100)) {
      return res.status(400).json({
        success: false,
        error: 'Username must be between 1 and 100 characters'
      });
    }

    if (first_name !== undefined && first_name !== null && !validateString(first_name, 1, 100)) {
      return res.status(400).json({
        success: false,
        error: 'First name must be between 1 and 100 characters'
      });
    }

    if (last_name !== undefined && last_name !== null && !validateString(last_name, 1, 100)) {
      return res.status(400).json({
        success: false,
        error: 'Last name must be between 1 and 100 characters'
      });
    }

    // Проверка существования ресторана
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('id', restaurant_id)
      .single();

    if (restaurantError || !restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    // Проверка на дубликат
    const { data: existing } = await supabase
      .from('chefs')
      .select('id')
      .eq('restaurant_id', restaurant_id)
      .eq('telegram_id', telegram_id)
      .single();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Chef with this telegram_id already exists for this restaurant'
      });
    }

    // Хешируем пароль
    const hashedPassword = await hashPassword(password);

    // Создание повара
    const { data, error } = await supabase
      .from('chefs')
      .insert({
        restaurant_id,
        telegram_id,
        telegram_chat_id,
        username: username || null,
        first_name: first_name || null,
        last_name: last_name || null,
        is_active,
        password: hashedPassword
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data: data as Chef
    });
  } catch (error: any) {
    console.error('Error creating chef:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create chef',
      message: error.message
    });
  }
}

/**
 * PATCH /api/chefs/:id
 * Обновить повара
 */
export async function updateChef(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { telegram_chat_id, username, first_name, last_name, is_active, password } = req.body;

    // Проверка существования
    const { data: existing, error: existingError } = await supabase
      .from('chefs')
      .select('id')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'Chef not found'
      });
    }

    // Обновление
    const updateData: any = {};
    if (telegram_chat_id !== undefined) updateData.telegram_chat_id = telegram_chat_id;
    if (username !== undefined) updateData.username = username;
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (password !== undefined && password !== '') {
      // Хешируем пароль только если он еще не хеширован
      updateData.password = isHashed(password) ? password : await hashPassword(password);
    }

    const { data, error } = await supabase
      .from('chefs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data as Chef
    });
  } catch (error: any) {
    console.error('Error updating chef:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update chef',
      message: error.message
    });
  }
}

/**
 * DELETE /api/chefs/:id
 * Удалить повара
 */
export async function deleteChef(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('chefs')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Chef deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting chef:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete chef',
      message: error.message
    });
  }
}


