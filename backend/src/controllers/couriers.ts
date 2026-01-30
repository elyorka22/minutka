// ============================================
// Couriers Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { Courier } from '../types';
import { validateTelegramId, validateString } from '../utils/validation';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * GET /api/couriers
 * Получить всех курьеров (только для super_admin)
 */
export async function getCouriers(req: AuthenticatedRequest, res: Response) {
  try {
    const { data, error } = await supabase
      .from('couriers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data as Courier[]
    });
  } catch (error: any) {
    console.error('Error fetching couriers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch couriers',
      message: error.message
    });
  }
}

/**
 * POST /api/couriers
 * Создать нового курьера (только для super_admin)
 */
export async function createCourier(req: AuthenticatedRequest, res: Response) {
  try {
    const { telegram_id, username, first_name, last_name, phone } = req.body;

    // Валидация
    if (!validateTelegramId(telegram_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid telegram_id'
      });
    }

    // Проверяем, не существует ли уже курьер с таким telegram_id
    const { data: existingCourier, error: checkError } = await supabase
      .from('couriers')
      .select('id')
      .eq('telegram_id', telegram_id)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existingCourier) {
      return res.status(400).json({
        success: false,
        error: 'Courier with this telegram_id already exists'
      });
    }

    // Создаем курьера
    const { data, error } = await supabase
      .from('couriers')
      .insert({
        telegram_id,
        username: validateString(username) ? username : null,
        first_name: validateString(first_name) ? first_name : null,
        last_name: validateString(last_name) ? last_name : null,
        phone: validateString(phone) ? phone : null,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data: data as Courier
    });
  } catch (error: any) {
    console.error('Error creating courier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create courier',
      message: error.message
    });
  }
}

/**
 * PUT /api/couriers/:id
 * Обновить курьера (только для super_admin)
 */
export async function updateCourier(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { telegram_id, username, first_name, last_name, phone, is_active } = req.body;

    // Валидация ID
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid courier ID'
      });
    }

    const updateData: any = {};

    if (telegram_id !== undefined) {
      if (!validateTelegramId(telegram_id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid telegram_id'
        });
      }
      updateData.telegram_id = telegram_id;
    }

    if (username !== undefined) {
      updateData.username = validateString(username) ? username : null;
    }

    if (first_name !== undefined) {
      updateData.first_name = validateString(first_name) ? first_name : null;
    }

    if (last_name !== undefined) {
      updateData.last_name = validateString(last_name) ? last_name : null;
    }

    if (phone !== undefined) {
      updateData.phone = validateString(phone) ? phone : null;
    }

    if (is_active !== undefined) {
      updateData.is_active = Boolean(is_active);
    }

    const { data, error } = await supabase
      .from('couriers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Courier not found'
      });
    }

    res.json({
      success: true,
      data: data as Courier
    });
  } catch (error: any) {
    console.error('Error updating courier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update courier',
      message: error.message
    });
  }
}

/**
 * DELETE /api/couriers/:id
 * Удалить курьера (только для super_admin)
 */
export async function deleteCourier(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid courier ID'
      });
    }

    const { error } = await supabase
      .from('couriers')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Courier deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting courier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete courier',
      message: error.message
    });
  }
}

/**
 * GET /api/couriers/active
 * Получить всех активных курьеров
 */
export async function getActiveCouriers(req: AuthenticatedRequest, res: Response) {
  try {
    const { data, error } = await supabase
      .from('couriers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data as Courier[]
    });
  } catch (error: any) {
    console.error('Error fetching active couriers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active couriers',
      message: error.message
    });
  }
}

