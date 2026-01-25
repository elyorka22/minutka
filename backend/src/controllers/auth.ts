// ============================================
// Auth Controller - Аутентификация через Telegram ID
// ============================================

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import bcrypt from 'bcrypt';

/**
 * GET /api/auth/me
 * Получить информацию о текущем пользователе и его роли по Telegram ID
 * Query params: telegram_id (required)
 */
export async function getCurrentUser(req: Request, res: Response) {
  try {
    const { telegram_id, password } = req.query;

    if (!telegram_id) {
      return res.status(400).json({
        success: false,
        error: 'telegram_id is required'
      });
    }

    const telegramId = BigInt(telegram_id as string);
    const hasPassword = password && typeof password === 'string' && password.trim().length > 0;

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
    let role = 'user';
    let userData: any = null;

    // Проверяем сотрудников (требуется пароль)
    if (superAdminResult.data && !superAdminResult.error) {
      // Для супер-админа требуется пароль
      if (hasPassword) {
        if (!superAdminResult.data.password) {
          return res.status(401).json({
            success: false,
            error: 'Пароль не установлен. Обратитесь к администратору.'
          });
        }
        const passwordMatch = await bcrypt.compare(password as string, superAdminResult.data.password);
        if (!passwordMatch) {
          return res.status(401).json({
            success: false,
            error: 'Неверный пароль'
          });
        }
      } else {
        return res.status(401).json({
          success: false,
          error: 'Для входа требуется пароль'
        });
      }
      role = 'super_admin';
      userData = superAdminResult.data;
    } else if (chefResult.data && !chefResult.error) {
      // Для повара требуется пароль
      if (hasPassword) {
        if (!chefResult.data.password) {
          return res.status(401).json({
            success: false,
            error: 'Пароль не установлен. Обратитесь к администратору.'
          });
        }
        const passwordMatch = await bcrypt.compare(password as string, chefResult.data.password);
        if (!passwordMatch) {
          return res.status(401).json({
            success: false,
            error: 'Неверный пароль'
          });
        }
      } else {
        return res.status(401).json({
          success: false,
          error: 'Для входа требуется пароль'
        });
      }
      role = 'chef';
      userData = chefResult.data;
    } else if (restaurantAdminResult.data && !restaurantAdminResult.error) {
      // Для админа ресторана требуется пароль
      if (hasPassword) {
        if (!restaurantAdminResult.data.password) {
          return res.status(401).json({
            success: false,
            error: 'Пароль не установлен. Обратитесь к администратору.'
          });
        }
        const passwordMatch = await bcrypt.compare(password as string, restaurantAdminResult.data.password);
        if (!passwordMatch) {
          return res.status(401).json({
            success: false,
            error: 'Неверный пароль'
          });
        }
      } else {
        return res.status(401).json({
          success: false,
          error: 'Для входа требуется пароль'
        });
      }
      role = 'restaurant_admin';
      userData = restaurantAdminResult.data;
    } else if (userResult.data && !userResult.error) {
      // Обычный пользователь - пароль не требуется
      if (hasPassword) {
        return res.status(401).json({
          success: false,
          error: 'Для клиентов пароль не требуется'
        });
      }
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

