// ============================================
// Auth Controller - Аутентификация через Telegram ID
// ============================================

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { comparePassword, isHashed, hashPassword } from '../utils/password';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * POST /api/auth/login
 * Вход для сотрудников (с паролем)
 * Body: { telegram_id: string, password: string }
 */
export async function loginStaff(req: Request, res: Response) {
  try {
    const { telegram_id, password } = req.body;

    if (!telegram_id || !password) {
      return res.status(400).json({
        success: false,
        error: 'telegram_id and password are required'
      });
    }

    const telegramId = BigInt(telegram_id as string);

    // Проверяем все роли сотрудников параллельно
    const [superAdminResult, chefResult, restaurantAdminResult] = await Promise.all([
      supabase
        .from('super_admins')
        .select('*')
        .eq('telegram_id', telegramId)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('chefs')
        .select('*')
        .eq('telegram_id', telegramId)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('restaurant_admins')
        .select('*')
        .eq('telegram_id', telegramId)
        .eq('is_active', true)
        .maybeSingle(),
    ]);

    // Определяем роль и проверяем пароль
    let role: string | null = null;
    let userData: any = null;

    if (superAdminResult.data && !superAdminResult.error) {
      // Проверяем пароль для супер-админа
      const storedPassword = superAdminResult.data.password;
      const passwordMatches = isHashed(storedPassword)
        ? await comparePassword(password, storedPassword)
        : storedPassword === password; // Для обратной совместимости со старыми паролями
      
      if (passwordMatches) {
        role = 'super_admin';
        userData = superAdminResult.data;
      } else {
        return res.status(401).json({
          success: false,
          error: 'Неверный пароль'
        });
      }
    } else if (chefResult.data && !chefResult.error) {
      // Проверяем пароль для повара
      const storedPassword = chefResult.data.password;
      const passwordMatches = isHashed(storedPassword)
        ? await comparePassword(password, storedPassword)
        : storedPassword === password; // Для обратной совместимости со старыми паролями
      
      if (passwordMatches) {
        role = 'chef';
        userData = chefResult.data;
      } else {
        return res.status(401).json({
          success: false,
          error: 'Неверный пароль'
        });
      }
    } else if (restaurantAdminResult.data && !restaurantAdminResult.error) {
      // Проверяем пароль для админа ресторана
      const storedPassword = restaurantAdminResult.data.password;
      const passwordMatches = isHashed(storedPassword)
        ? await comparePassword(password, storedPassword)
        : storedPassword === password; // Для обратной совместимости со старыми паролями
      
      if (passwordMatches) {
        role = 'restaurant_admin';
        userData = restaurantAdminResult.data;
      } else {
        return res.status(401).json({
          success: false,
          error: 'Неверный пароль'
        });
      }
    } else {
      return res.status(404).json({
        success: false,
        error: 'Сотрудник с таким Telegram ID не найден'
      });
    }

    res.json({
      success: true,
      data: {
        role,
        user: userData,
        telegram_id: telegramId.toString()
      }
    });
  } catch (error: any) {
    console.error('Error in loginStaff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login',
      message: error.message
    });
  }
}

/**
 * GET /api/auth/me
 * Получить информацию о текущем пользователе и его роли по Telegram ID
 * Query params: telegram_id (required)
 * Для клиентов (mijoz) - без пароля
 */
export async function getCurrentUser(req: Request, res: Response) {
  try {
    const { telegram_id } = req.query;

    if (!telegram_id) {
      return res.status(400).json({
        success: false,
        error: 'telegram_id is required'
      });
    }

    const telegramId = BigInt(telegram_id as string);

    // Проверяем все роли параллельно
    const [superAdminResult, chefResult, restaurantAdminResult, userResult] = await Promise.all([
      // Проверяем супер-админа
      supabase
        .from('super_admins')
        .select('*')
        .eq('telegram_id', telegramId)
        .eq('is_active', true)
        .single(),
      // Проверяем повара
      supabase
        .from('chefs')
        .select('*')
        .eq('telegram_id', telegramId)
        .eq('is_active', true)
        .maybeSingle(),
      // Проверяем админа ресторана
      supabase
        .from('restaurant_admins')
        .select('*')
        .eq('telegram_id', telegramId)
        .eq('is_active', true)
        .maybeSingle(),
      // Проверяем обычного пользователя
      supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .single()
    ]);

    // Определяем роль пользователя
    // Если пользователь является сотрудником, требуем пароль через /api/auth/login
    if (superAdminResult.data && !superAdminResult.error) {
      return res.status(401).json({
        success: false,
        error: 'Для входа сотрудника требуется пароль. Используйте форму входа для сотрудников.'
      });
    }
    if (chefResult.data && !chefResult.error) {
      return res.status(401).json({
        success: false,
        error: 'Для входа сотрудника требуется пароль. Используйте форму входа для сотрудников.'
      });
    }
    if (restaurantAdminResult.data && !restaurantAdminResult.error) {
      return res.status(401).json({
        success: false,
        error: 'Для входа сотрудника требуется пароль. Используйте форму входа для сотрудников.'
      });
    }

    // Если не сотрудник, проверяем обычного пользователя
    let role = 'user';
    let userData: any = null;

    if (userResult.data && !userResult.error) {
      role = 'user';
      userData = userResult.data;
    } else {
      // Пользователь не найден, создаем его как обычного пользователя
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          telegram_id: telegramId,
          username: null,
          first_name: null,
          last_name: null
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      role = 'user';
      userData = newUser;
    }

    res.json({
      success: true,
      data: {
        role,
        user: userData,
        telegram_id: telegramId.toString()
      }
    });
  } catch (error: any) {
    console.error('Error in getCurrentUser:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info',
      message: error.message
    });
  }
}

