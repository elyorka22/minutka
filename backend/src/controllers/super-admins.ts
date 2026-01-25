// ============================================
// Super Admins Controller
// ============================================

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import bcrypt from 'bcrypt';

/**
 * POST /api/super-admins
 * Создать нового супер-админа
 * Body: { telegram_id, username?, first_name?, last_name?, password }
 */
export async function createSuperAdmin(req: Request, res: Response) {
  try {
    const { telegram_id, username, first_name, last_name, password } = req.body;

    if (!telegram_id || !password) {
      return res.status(400).json({
        success: false,
        error: 'telegram_id and password are required'
      });
    }

    const telegramId = BigInt(telegram_id);

    // Проверка на существование
    const { data: existing } = await supabase
      .from('super_admins')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Super admin with this telegram_id already exists'
      });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    // Создание супер-админа
    const { data, error } = await supabase
      .from('super_admins')
      .insert({
        telegram_id: telegramId,
        username: username || null,
        first_name: first_name || null,
        last_name: last_name || null,
        password: hashedPassword,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Error creating super admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create super admin',
      message: error.message
    });
  }
}

/**
 * PATCH /api/super-admins/:id/password
 * Обновить пароль супер-админа
 */
export async function updateSuperAdminPassword(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const { data, error } = await supabase
      .from('super_admins')
      .update({ password: hashedPassword })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Error updating super admin password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update password',
      message: error.message
    });
  }
}

