// ============================================
// Users Controller
// ============================================

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { User } from '../types';
import { serializeBigInt } from '../utils/bigint';

/**
 * GET /api/users
 * Получить список пользователей
 */
export async function getUsers(req: Request, res: Response) {
  try {
    const { page, limit } = req.query;

    // Параметры пагинации
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;

    // Запрос для получения общего количества
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    // Запрос для получения данных с пагинацией
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) {
      throw error;
    }

    // Конвертируем BigInt в строку для JSON сериализации
    const usersData = serializeBigInt(data || []);

    // Используем JSON.stringify с кастомным replacer для гарантированной сериализации
    const serialized = JSON.parse(JSON.stringify(usersData, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    }));

    const totalPages = Math.ceil((count || 0) / limitNum);

    res.json({
      success: true,
      data: serialized as User[],
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
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
}

/**
 * GET /api/users/:id
 * Получить пользователя по ID
 */
export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Конвертируем BigInt в строку для JSON сериализации
    const userData = serializeBigInt(data);

    // Используем JSON.stringify с кастомным replacer для гарантированной сериализации
    const serialized = JSON.parse(JSON.stringify(userData, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    }));

    res.json({
      success: true,
      data: serialized as User
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error.message
    });
  }
}

/**
 * GET /api/users?telegram_id=...
 * Получить пользователя по Telegram ID
 */
export async function getUserByTelegramId(req: Request, res: Response) {
  try {
    const { telegram_id } = req.query;

    if (!telegram_id) {
      return res.status(400).json({
        success: false,
        error: 'telegram_id is required'
      });
    }

    const telegramId = BigInt(telegram_id as string);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId);

      if (error) {
        throw error;
      }

      // Конвертируем BigInt в строку для JSON сериализации
      const usersData = serializeBigInt(data || []);

      // Используем JSON.stringify с кастомным replacer для гарантированной сериализации
      const serialized = JSON.parse(JSON.stringify(usersData, (key, value) => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        return value;
      }));

      res.json({
        success: true,
        data: serialized as User[]
      });
  } catch (error: any) {
    console.error('Error fetching user by telegram_id:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error.message
    });
  }
}

/**
 * POST /api/users
 * Создать нового пользователя
 */
export async function createUser(req: Request, res: Response) {
  try {
    const { telegram_id, username, first_name, last_name, phone } = req.body;

      // Если указан telegram_id, проверяем существование
    if (telegram_id) {
      const telegramId = BigInt(telegram_id);
      // Используем .select() вместо .maybeSingle() чтобы избежать проблем с сериализацией
      const existingResult = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .limit(1);

      if (existingResult.error && existingResult.error.code !== 'PGRST116') {
        throw existingResult.error;
      }

      if (existingResult.data && existingResult.data.length > 0) {
        const existing = existingResult.data[0];
        
        // Немедленная конвертация BigInt в строку
        let telegramIdStr: string | null = null;
        try {
          if (existing.telegram_id !== null && existing.telegram_id !== undefined) {
            if (typeof existing.telegram_id === 'bigint') {
              telegramIdStr = existing.telegram_id.toString();
            } else {
              telegramIdStr = String(existing.telegram_id);
            }
          }
        } catch (e) {
          console.error('Error converting telegram_id:', e);
          telegramIdStr = null;
        }
        
        // Пользователь уже существует, возвращаем его
        // Ручная конвертация BigInt в строку
        const userData: any = {
          id: String(existing.id),
          telegram_id: telegramIdStr,
          username: existing.username || null,
          first_name: existing.first_name || null,
          last_name: existing.last_name || null,
          phone: existing.phone || null,
          created_at: existing.created_at,
          updated_at: existing.updated_at
        };
        
        return res.json({
          success: true,
          data: userData as User
        });
      }

      // Создаем нового пользователя с telegram_id
      // Используем .select() без .single() чтобы избежать проблем с сериализацией
      const insertResult = await supabase
        .from('users')
        .insert({
          telegram_id: telegramId,
          username: username || null,
          first_name: first_name || null,
          last_name: last_name || null,
          phone: phone || null
        })
        .select();

      if (insertResult.error) {
        console.error('Supabase insert error:', insertResult.error);
        throw insertResult.error;
      }

      if (!insertResult.data || insertResult.data.length === 0) {
        throw new Error('User created but no data returned');
      }

      const data = insertResult.data[0];

      // Немедленная конвертация BigInt в строку, избегая любых операций с BigInt
      let telegramIdStr: string | null = null;
      try {
        if (data.telegram_id !== null && data.telegram_id !== undefined) {
          // Используем явное приведение через Number или String
          if (typeof data.telegram_id === 'bigint') {
            telegramIdStr = data.telegram_id.toString();
          } else if (typeof data.telegram_id === 'number') {
            telegramIdStr = String(data.telegram_id);
          } else {
            telegramIdStr = String(data.telegram_id);
          }
        }
      } catch (e) {
        console.error('Error converting telegram_id:', e);
        telegramIdStr = null;
      }

      // Ручная конвертация BigInt в строку перед сериализацией
      const userData: any = {
        id: String(data.id),
        telegram_id: telegramIdStr,
        username: data.username || null,
        first_name: data.first_name || null,
        last_name: data.last_name || null,
        phone: data.phone || null,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      res.status(201).json({
        success: true,
        data: userData as User
      });
    } else {
      // Создаем пользователя без telegram_id (временный пользователь)
      const insertResult = await supabase
        .from('users')
        .insert({
          telegram_id: null,
          username: username || null,
          first_name: first_name || null,
          last_name: last_name || null,
          phone: phone || null
        })
        .select();

      if (insertResult.error) {
        console.error('Supabase insert error:', insertResult.error);
        throw insertResult.error;
      }

      if (!insertResult.data || insertResult.data.length === 0) {
        throw new Error('User created but no data returned');
      }

      const data = insertResult.data[0];

      // Немедленная конвертация BigInt в строку, избегая любых операций с BigInt
      let telegramIdStr: string | null = null;
      try {
        if (data.telegram_id !== null && data.telegram_id !== undefined) {
          if (typeof data.telegram_id === 'bigint') {
            telegramIdStr = data.telegram_id.toString();
          } else if (typeof data.telegram_id === 'number') {
            telegramIdStr = String(data.telegram_id);
          } else {
            telegramIdStr = String(data.telegram_id);
          }
        }
      } catch (e) {
        console.error('Error converting telegram_id:', e);
        telegramIdStr = null;
      }

      // Ручная конвертация BigInt в строку перед сериализацией
      const userData: any = {
        id: String(data.id),
        telegram_id: telegramIdStr,
        username: data.username || null,
        first_name: data.first_name || null,
        last_name: data.last_name || null,
        phone: data.phone || null,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      res.status(201).json({
        success: true,
        data: userData as User
      });
    }
  } catch (error: any) {
    console.error('Error creating user:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    
    // Безопасная сериализация ошибки (без BigInt)
    let errorMessage = 'Failed to create user';
    let errorCode = error?.code;
    let errorDetails = null;
    
    try {
      // Пытаемся извлечь сообщение об ошибке безопасным способом
      if (error?.message) {
        errorMessage = String(error.message);
      }
      
      if (error?.code) {
        errorCode = String(error.code);
      }
      
      // Пытаемся безопасно сериализовать детали ошибки
      if (error?.details || error?.hint) {
        errorDetails = {
          details: error.details ? String(error.details) : null,
          hint: error.hint ? String(error.hint) : null
        };
      }
    } catch (e) {
      console.error('Error extracting error details:', e);
    }
    
    // Отправляем безопасный ответ без BigInt
    const errorResponse: any = {
      success: false,
      error: 'Failed to create user',
      message: errorMessage
    };
    
    if (errorCode) {
      errorResponse.code = errorCode;
    }
    
    if (errorDetails) {
      errorResponse.details = errorDetails;
    }
    
    res.status(500).json(errorResponse);
  }
}

