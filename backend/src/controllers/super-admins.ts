// ============================================
// Super Admins Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { SuperAdmin } from '../types';
import { hashPassword, isHashed } from '../utils/password';
import { validateTelegramId, validatePassword, validateString } from '../utils/validation';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * GET /api/super-admins
 * Получить всех супер-админов
 */
export async function getSuperAdmins(req: AuthenticatedRequest, res: Response) {
  try {
    const { data, error } = await supabase
      .from('super_admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ success: true, data: data as SuperAdmin[] });
  } catch (error: any) {
    console.error('Error fetching super admins:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch super admins', message: error.message });
  }
}

/**
 * GET /api/super-admins/:id
 * Получить супер-админа по ID
 */
export async function getSuperAdminById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('super_admins')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Super admin not found' });
      }
      throw error;
    }

    res.json({ success: true, data: data as SuperAdmin });
  } catch (error: any) {
    console.error('Error fetching super admin:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch super admin', message: error.message });
  }
}

/**
 * POST /api/super-admins
 * Создать нового супер-админа
 */
export async function createSuperAdmin(req: AuthenticatedRequest, res: Response) {
  try {
    const { telegram_id, username, first_name, last_name, password, is_active } = req.body;

    // Валидация обязательных полей
    if (!telegram_id || !password) {
      return res.status(400).json({ success: false, error: 'Missing required fields: telegram_id, password' });
    }

    // Валидация форматов
    if (!validateTelegramId(telegram_id)) {
      return res.status(400).json({ success: false, error: 'Invalid telegram_id format' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
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

    // Проверка на дубликат
    const { data: existing } = await supabase
      .from('super_admins')
      .select('id')
      .eq('telegram_id', telegram_id)
      .single();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Super admin with this telegram_id already exists'
      });
    }

    // Хешируем пароль
    const hashedPassword = await hashPassword(password);

    // Создание супер-админа
    const { data, error } = await supabase
      .from('super_admins')
      .insert({
        telegram_id,
        username: username || null,
        first_name: first_name || null,
        last_name: last_name || null,
        password: hashedPassword,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ success: true, data: data as SuperAdmin });
  } catch (error: any) {
    console.error('Error creating super admin:', error);
    res.status(500).json({ success: false, error: 'Failed to create super admin', message: error.message });
  }
}

/**
 * PATCH /api/super-admins/:id
 * Обновить супер-админа
 */
export async function updateSuperAdmin(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { username, first_name, last_name, password, is_active } = req.body;

    // Проверка существования
    const { data: existing, error: existingError } = await supabase
      .from('super_admins')
      .select('id')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return res.status(404).json({ success: false, error: 'Super admin not found' });
    }

    // Обновление
    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (password !== undefined) {
      // Хешируем пароль только если он еще не хеширован
      updateData.password = isHashed(password) ? password : await hashPassword(password);
    }
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('super_admins')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({ success: true, data: data as SuperAdmin });
  } catch (error: any) {
    console.error('Error updating super admin:', error);
    res.status(500).json({ success: false, error: 'Failed to update super admin', message: error.message });
  }
}

/**
 * DELETE /api/super-admins/:id
 * Удалить супер-админа
 */
export async function deleteSuperAdmin(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('super_admins')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({ success: true, message: 'Super admin deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting super admin:', error);
    res.status(500).json({ success: false, error: 'Failed to delete super admin', message: error.message });
  }
}

