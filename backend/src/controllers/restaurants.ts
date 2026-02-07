// ============================================
// Restaurants Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { Restaurant } from '../types';
import { hashPassword } from '../utils/password';
import { AuthenticatedRequest } from '../middleware/auth';
import { validateString, validatePhone, validateUrl, validateTelegramId } from '../utils/validation';
import { Logger } from '../services/logger';

/**
 * GET /api/restaurants
 * Получить список активных ресторанов
 * Публичный доступ
 */
export async function getRestaurants(req: AuthenticatedRequest, res: Response) {
  try {
    const { featured, page, limit, type } = req.query;

    // Параметры пагинации
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;

    // Запрос для получения общего количества
    let countQuery = supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (featured === 'true') {
      countQuery = countQuery.eq('is_featured', true);
    }

    // Фильтрация по типу (restaurant или store)
    if (type === 'restaurant' || type === 'store') {
      countQuery = countQuery.eq('type', type);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    // Запрос для получения данных с пагинацией
    let query = supabase
      .from('restaurants')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('name', { ascending: true })
      .range(offset, offset + limitNum - 1);

    // Фильтрация по типу (restaurant или store)
    if (type === 'restaurant' || type === 'store') {
      query = query.eq('type', type);
    }

    // Если запрашивают только топовые рестораны
    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    const { data: restaurants, error } = await query;

    if (error) {
      throw error;
    }

    // Получаем админов для каждого ресторана
    const restaurantsWithAdmins = await Promise.all(
      (restaurants || []).map(async (restaurant: any) => {
        const { data: admins } = await supabase
          .from('restaurant_admins')
          .select('telegram_id, phone, password')
          .eq('restaurant_id', restaurant.id)
          .eq('is_active', true)
          .limit(1);
        
        return {
          ...restaurant,
          admin: admins && admins.length > 0 ? admins[0] : null
        };
      })
    );

    const totalPages = Math.ceil((count || 0) / limitNum);

    // Добавляем заголовки кеширования для публичных данных (кеш на 1 минуту)
    res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    
    res.json({
      success: true,
      data: restaurantsWithAdmins as any[],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error: any) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch restaurants',
      message: error.message
    });
  }
}

/**
 * GET /api/restaurants/:id
 * Получить детали ресторана по ID
 * Публичный доступ
 */
export async function getRestaurantById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Restaurant not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data: data as Restaurant
    });
  } catch (error: any) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch restaurant',
      message: error.message
    });
  }
}

/**
 * POST /api/restaurants
 * Создать новый ресторан
 * Body: { name, description, phone, image_url, is_active, is_featured, admin_telegram_id? }
 * Только для супер-админов
 */
export async function createRestaurant(req: AuthenticatedRequest, res: Response) {
  // Проверка прав доступа
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Only super admins can create restaurants'
    });
  }
  try {
    const { name, description, phone, image_url, is_active, is_featured, admin_telegram_id, admin_phone, admin_password, type, delivery_text } = req.body;

    console.log('Creating restaurant with data:', {
      name,
      description,
      phone,
      image_url,
      is_active,
      is_featured,
      admin_telegram_id,
      admin_telegram_id_type: typeof admin_telegram_id,
      admin_phone,
      has_admin_password: !!admin_password
    });

    // Валидация данных
    if (!name || !validateString(name, 1, 255)) {
      return res.status(400).json({
        success: false,
        error: 'Название ресторана обязательно и должно содержать от 1 до 255 символов'
      });
    }

    if (description && !validateString(description, 0, 2000)) {
      return res.status(400).json({
        success: false,
        error: 'Описание не должно превышать 2000 символов'
      });
    }

    if (phone && !validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат телефона ресторана. Телефон должен начинаться с +998 и содержать 9 цифр после префикса (например: +998901234567)'
      });
    }

    if (image_url && !validateUrl(image_url)) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат URL изображения. Укажите корректную ссылку на изображение'
      });
    }

    if (admin_telegram_id && !validateTelegramId(admin_telegram_id)) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат Telegram ID админа. Telegram ID должен быть положительным числом'
      });
    }

    if (admin_phone && !validatePhone(admin_phone)) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат телефона админа. Телефон должен начинаться с +998 и содержать 9 цифр после префикса (например: +998901234567)'
      });
    }

    // Валидация типа (restaurant или store)
    if (type && type !== 'restaurant' && type !== 'store') {
      return res.status(400).json({
        success: false,
        error: 'Тип должен быть "restaurant" или "store"'
      });
    }

    // Создаем ресторан или магазин
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert({
        name,
        description: description || null,
        phone: phone || null,
        image_url: image_url || null,
        is_active: is_active ?? true,
        is_featured: is_featured ?? false,
        type: type || 'restaurant', // По умолчанию restaurant для обратной совместимости
        delivery_text: delivery_text || null,
        telegram_chat_id: null
      })
      .select()
      .single();

    if (restaurantError) {
      console.error('Error creating restaurant:', restaurantError);
      throw restaurantError;
    }

    // Если указан admin_telegram_id, создаем админа ресторана
    if (admin_telegram_id && admin_telegram_id !== '' && admin_telegram_id !== null && admin_telegram_id !== undefined) {
      try {
        // Преобразуем в число, если это строка
        let telegramId: number;
        if (typeof admin_telegram_id === 'string') {
          telegramId = parseInt(admin_telegram_id, 10);
        } else if (typeof admin_telegram_id === 'number') {
          telegramId = admin_telegram_id;
        } else {
          console.error('Invalid admin_telegram_id type:', typeof admin_telegram_id, admin_telegram_id);
          telegramId = NaN;
        }

        if (isNaN(telegramId) || telegramId <= 0) {
          console.error('Invalid admin_telegram_id value:', admin_telegram_id, '->', telegramId);
          return res.status(400).json({
            success: false,
            error: 'Invalid admin Telegram ID'
          });
        }

        console.log(`Creating restaurant admin for restaurant ${restaurant.id} with telegram_id ${telegramId}`);
        
        // Проверяем, существует ли уже админ с таким telegram_id для этого ресторана
        const { data: existingLink, error: linkCheckError } = await supabase
          .from('restaurant_admins')
          .select('id')
          .eq('restaurant_id', restaurant.id)
          .eq('telegram_id', telegramId)
          .maybeSingle();

        if (linkCheckError && linkCheckError.code !== 'PGRST116') {
          console.error('Error checking existing link:', linkCheckError);
          return res.status(500).json({
            success: false,
            error: 'Failed to check existing admin link',
            message: linkCheckError.message
          });
        }

        if (existingLink) {
          console.log(`Admin ${telegramId} is already linked to restaurant ${restaurant.id}`);
          // Админ уже связан с этим рестораном - это нормально, просто пропускаем создание
        } else {
          // Проверяем, существует ли уже админ с таким telegram_id для другого ресторана
          const { data: existingAdmin, error: checkError } = await supabase
            .from('restaurant_admins')
            .select('id, password')
            .eq('telegram_id', telegramId)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

          if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking existing admin:', checkError);
            return res.status(500).json({
              success: false,
              error: 'Failed to check existing admin',
              message: checkError.message
            });
          }

          // Определяем пароль: если админ существует, используем существующий пароль, если указан новый - хешируем его
          let hashedPassword: string | null = null;
          if (existingAdmin) {
            // Админ уже существует - используем существующий пароль, если новый не указан
            if (admin_password && admin_password.trim() !== '') {
              hashedPassword = await hashPassword(admin_password);
              console.log(`Admin with telegram_id ${telegramId} already exists, updating password`);
            } else {
              // Используем существующий пароль
              hashedPassword = existingAdmin.password;
              console.log(`Admin with telegram_id ${telegramId} already exists, using existing password`);
            }
          } else {
            // Новый админ - пароль обязателен
            if (!admin_password || admin_password.trim() === '') {
              return res.status(400).json({
                success: false,
                error: 'Password is required for new admin'
              });
            }
            hashedPassword = await hashPassword(admin_password);
            console.log(`Creating new admin with telegram_id ${telegramId}`);
          }

          const { data: adminData, error: adminError } = await supabase
            .from('restaurant_admins')
            .insert({
              restaurant_id: restaurant.id,
              telegram_id: telegramId,
              username: null,
              first_name: null,
              last_name: null,
              phone: admin_phone || null,
              password: hashedPassword,
              is_active: true
            })
            .select()
            .single();

          if (adminError) {
            console.error('Error creating restaurant admin:', adminError);
            console.error('Admin error details:', {
              message: adminError.message,
              code: adminError.code,
              details: adminError.details,
              hint: adminError.hint
            });
            return res.status(400).json({
              success: false,
              error: 'Failed to create restaurant admin',
              message: adminError.message,
              code: adminError.code
            });
          } else {
            console.log(`Restaurant admin created successfully:`, adminData);
          }
        }
      } catch (adminErr: any) {
        console.error('Exception creating restaurant admin:', adminErr);
        console.error('Exception stack:', adminErr.stack);
        return res.status(500).json({
          success: false,
          error: 'Failed to create restaurant admin',
          message: adminErr.message
        });
      }
    }

    res.status(201).json({
      success: true,
      data: restaurant as Restaurant
    });
  } catch (error: any) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create restaurant',
      message: error.message
    });
  }
}

/**
 * PATCH /api/restaurants/:id
 * Обновить ресторан
 * Админ ресторана может обновлять только свой ресторан
 */
export async function updateRestaurant(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, phone, image_url, delivery_text, is_active, is_featured, working_hours, type } = req.body;

    // Валидация ID
    if (!id || !validateString(id, 1, 100)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid restaurant ID format'
      });
    }

    // Валидация полей если они переданы
    if (name !== undefined && !validateString(name, 1, 255)) {
      return res.status(400).json({
        success: false,
        error: 'Название ресторана должно содержать от 1 до 255 символов'
      });
    }

    if (description !== undefined && description !== null && !validateString(description, 0, 2000)) {
      return res.status(400).json({
        success: false,
        error: 'Описание не должно превышать 2000 символов'
      });
    }

    if (phone !== undefined && phone !== null && !validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат телефона ресторана. Телефон должен начинаться с +998 и содержать 9 цифр после префикса (например: +998901234567)'
      });
    }

    if (image_url !== undefined && image_url !== null && !validateUrl(image_url)) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат URL изображения. Укажите корректную ссылку на изображение'
      });
    }

    // Проверка прав доступа
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Супер-админы могут обновлять любые рестораны
    if (req.user.role !== 'super_admin') {
      // Админы ресторана могут обновлять только свой ресторан
      if (req.user.role === 'restaurant_admin' && req.user.restaurant_id !== id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You can only update your own restaurant'
        });
      }
      
      // Повары не могут обновлять рестораны
      if (req.user.role === 'chef') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Chefs cannot update restaurants'
        });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (phone !== undefined) updateData.phone = phone;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (delivery_text !== undefined) updateData.delivery_text = delivery_text;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (working_hours !== undefined) updateData.working_hours = working_hours;
    if (type !== undefined) {
      // Валидация типа
      if (type !== 'restaurant' && type !== 'store') {
        return res.status(400).json({
          success: false,
          error: 'Тип должен быть "restaurant" или "store"'
        });
      }
      updateData.type = type;
    }

    const { data, error } = await supabase
      .from('restaurants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data as Restaurant
    });
  } catch (error: any) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update restaurant',
      message: error.message
    });
  }
}

/**
 * DELETE /api/restaurants/:id
 * Удалить ресторан
 * Только для супер-админов
 */
export async function deleteRestaurant(req: AuthenticatedRequest, res: Response) {
  // Проверка прав доступа
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Only super admins can delete restaurants'
    });
  }
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.status(204).json({
      success: true,
      message: 'Restaurant deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete restaurant',
      message: error.message
    });
  }
}


