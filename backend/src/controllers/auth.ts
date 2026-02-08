// ============================================
// Auth Controller - Аутентификация через Telegram ID
// ============================================

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { comparePassword, isHashed, hashPassword } from '../utils/password';
import { AuthenticatedRequest } from '../middleware/auth';
import { validateTelegramId, validatePassword } from '../utils/validation';

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
        .eq('is_active', true),
    ]);

    // Определяем роль и проверяем пароль
    // Приоритет: super_admin > restaurant_admin > chef
    let role: string | null = null;
    let userData: any = null;

    console.log(`[Auth] Login attempt for telegram_id: ${telegramId}`, {
      superAdmin: !!superAdminResult.data,
      chef: !!chefResult.data,
      restaurantAdmin: !!(restaurantAdminResult.data && restaurantAdminResult.data.length > 0),
      restaurantAdminCount: restaurantAdminResult.data?.length || 0,
      errors: {
        superAdmin: superAdminResult.error,
        chef: chefResult.error,
        restaurantAdmin: restaurantAdminResult.error
      }
    });

    // Если пользователь найден и как restaurant_admin, и как chef, 
    // приоритет должен быть у restaurant_admin
    if (restaurantAdminResult.data && restaurantAdminResult.data.length > 0 && !restaurantAdminResult.error && chefResult.data && !chefResult.error) {
      console.log(`[Auth] WARNING: User ${telegramId} found in both restaurant_admins and chefs tables. Prioritizing restaurant_admin.`);
    }

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
    } else if (restaurantAdminResult.data && restaurantAdminResult.data.length > 0 && !restaurantAdminResult.error) {
      // Проверяем пароль для админа ресторана (приоритет выше, чем у повара)
      // У админа может быть несколько записей (для разных ресторанов), проверяем пароль в любой из них
      console.log(`[Auth] Found ${restaurantAdminResult.data.length} restaurant_admin record(s) for ${telegramId}, checking password`);
      
      // Проверяем пароль в первой записи (пароль должен быть одинаковым для всех ресторанов одного админа)
      const firstAdminRecord = restaurantAdminResult.data[0];
      const storedPassword = firstAdminRecord.password;
      const passwordMatches = isHashed(storedPassword)
        ? await comparePassword(password, storedPassword)
        : storedPassword === password; // Для обратной совместимости со старыми паролями
      
      console.log(`[Auth] Password match for restaurant_admin: ${passwordMatches}`);
      
      if (passwordMatches) {
        // У админа может быть несколько ресторанов
        const adminRecords = restaurantAdminResult.data;
        
        console.log(`[Auth] Admin has ${adminRecords.length} restaurant(s):`, {
          count: adminRecords.length,
          restaurant_ids: adminRecords.map((r: any) => r.restaurant_id)
        });
        
        if (adminRecords.length > 1) {
          // У админа несколько ресторанов - возвращаем флаг для выбора ресторана
          console.log(`[Auth] Admin has ${adminRecords.length} restaurants, setting hasMultipleRestaurants flag`);
          role = 'restaurant_admin';
          userData = {
            ...firstAdminRecord,
            hasMultipleRestaurants: true,
            restaurantCount: adminRecords.length
          };
        } else {
          // У админа один ресторан - возвращаем как обычно с restaurant_id
          console.log(`[Auth] Admin has 1 restaurant, setting restaurant_id: ${firstAdminRecord.restaurant_id}`);
          role = 'restaurant_admin';
          userData = {
            ...firstAdminRecord,
            restaurant_id: firstAdminRecord.restaurant_id
          };
        }
      } else {
        return res.status(401).json({
          success: false,
          error: 'Неверный пароль'
        });
      }
    } else if (chefResult.data && !chefResult.error) {
      // Проверяем пароль для повара (низший приоритет)
      console.log(`[Auth] Found chef record for ${telegramId}, checking password (restaurant_admin was not found or password didn't match)`);
      const storedPassword = chefResult.data.password;
      const passwordMatches = isHashed(storedPassword)
        ? await comparePassword(password, storedPassword)
        : storedPassword === password; // Для обратной совместимости со старыми паролями
      
      console.log(`[Auth] Password match for chef: ${passwordMatches}`);
      
      if (passwordMatches) {
        console.log(`[Auth] Setting role to chef for ${telegramId}`);
        role = 'chef';
        userData = chefResult.data;
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

    console.log(`[Auth] Final role determination for ${telegramId}:`, {
      role,
      hasUserData: !!userData,
      userDataId: userData?.id
    });

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
    // Приоритет: super_admin > restaurant_admin > chef
    // Для автоматического редиректа возвращаем роль сотрудника без полных данных
    if (superAdminResult.data && !superAdminResult.error) {
      return res.json({
        success: true,
        data: {
          role: 'super_admin',
          user: {
            id: superAdminResult.data.id,
            telegram_id: superAdminResult.data.telegram_id,
            is_active: superAdminResult.data.is_active
          },
          telegram_id: telegramId.toString()
        }
      });
    }
    if (restaurantAdminResult.data && !restaurantAdminResult.error) {
      // У админа может быть несколько ресторанов
      const { data: adminRecords, error: adminError } = await supabase
        .from('restaurant_admins')
        .select('*')
        .eq('telegram_id', telegramId)
        .eq('is_active', true);

      if (adminError) {
        throw adminError;
      }

      const adminData = adminRecords || [];
      const firstAdmin = adminData[0];

      if (adminData.length > 1) {
        return res.json({
          success: true,
          data: {
            role: 'restaurant_admin',
            user: {
              ...firstAdmin,
              hasMultipleRestaurants: true,
              restaurantCount: adminData.length
            },
            telegram_id: telegramId.toString()
          }
        });
      } else {
        return res.json({
          success: true,
          data: {
            role: 'restaurant_admin',
            user: {
              ...firstAdmin,
              restaurant_id: firstAdmin.restaurant_id
            },
            telegram_id: telegramId.toString()
          }
        });
      }
    }
    if (chefResult.data && !chefResult.error) {
      return res.json({
        success: true,
        data: {
          role: 'chef',
          user: chefResult.data,
          telegram_id: telegramId.toString()
        }
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

/**
 * POST /api/auth/change-password
 * Изменить пароль сотрудника
 * Body: { telegram_id: string, old_password: string, new_password: string }
 */
export async function changePassword(req: Request, res: Response) {
  try {
    const { telegram_id, old_password, new_password } = req.body;

    // Валидация обязательных полей
    if (!telegram_id || !old_password || !new_password) {
      return res.status(400).json({
        success: false,
        error: 'telegram_id, old_password, and new_password are required'
      });
    }

    // Валидация форматов
    if (!validateTelegramId(telegram_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid telegram_id format'
      });
    }

    if (!validatePassword(old_password, 1)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid old password format'
      });
    }

    if (!validatePassword(new_password, 6)) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long and less than 255 characters'
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

    // Определяем роль и проверяем старый пароль
    // Приоритет: super_admin > restaurant_admin > chef
    let userData: any = null;
    let tableName: string = '';
    let userId: string = '';

    if (superAdminResult.data && !superAdminResult.error) {
      const storedPassword = superAdminResult.data.password;
      const passwordMatches = isHashed(storedPassword)
        ? await comparePassword(old_password, storedPassword)
        : storedPassword === old_password;
      
      if (!passwordMatches) {
        return res.status(401).json({
          success: false,
          error: 'Неверный текущий пароль'
        });
      }
      
      userData = superAdminResult.data;
      tableName = 'super_admins';
      userId = superAdminResult.data.id;
    } else if (restaurantAdminResult.data && !restaurantAdminResult.error) {
      const storedPassword = restaurantAdminResult.data.password;
      const passwordMatches = isHashed(storedPassword)
        ? await comparePassword(old_password, storedPassword)
        : storedPassword === old_password;
      
      if (!passwordMatches) {
        return res.status(401).json({
          success: false,
          error: 'Неверный текущий пароль'
        });
      }
      
      userData = restaurantAdminResult.data;
      tableName = 'restaurant_admins';
      userId = restaurantAdminResult.data.id;
    } else if (chefResult.data && !chefResult.error) {
      const storedPassword = chefResult.data.password;
      const passwordMatches = isHashed(storedPassword)
        ? await comparePassword(old_password, storedPassword)
        : storedPassword === old_password;
      
      if (!passwordMatches) {
        return res.status(401).json({
          success: false,
          error: 'Неверный текущий пароль'
        });
      }
      
      userData = chefResult.data;
      tableName = 'chefs';
      userId = chefResult.data.id;
    } else {
      return res.status(404).json({
        success: false,
        error: 'Сотрудник с таким Telegram ID не найден'
      });
    }

    // Хешируем новый пароль
    const hashedNewPassword = await hashPassword(new_password);

    // Обновляем пароль
    const { data, error } = await supabase
      .from(tableName)
      .update({ password: hashedNewPassword })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Пароль успешно изменен'
    });
  } catch (error: any) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      message: error.message
    });
  }
}

