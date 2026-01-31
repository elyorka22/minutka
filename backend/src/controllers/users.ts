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
      const { data: existingData, error: existingError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .limit(1);

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (existingData && existingData.length > 0) {
        const existing = existingData[0];
        // Пользователь уже существует, возвращаем его
        // Ручная конвертация BigInt в строку
        const userData: any = {
          id: existing.id,
          telegram_id: existing.telegram_id ? String(existing.telegram_id) : null,
          username: existing.username,
          first_name: existing.first_name,
          last_name: existing.last_name,
          phone: existing.phone,
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
      const { data: insertData, error } = await supabase
        .from('users')
        .insert({
          telegram_id: telegramId,
          username: username || null,
          first_name: first_name || null,
          last_name: last_name || null,
          phone: phone || null
        })
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      if (!insertData || insertData.length === 0) {
        throw new Error('User created but no data returned');
      }

      const data = insertData[0];

      // Ручная конвертация BigInt в строку перед сериализацией
      const userData: any = {
        id: data.id,
        telegram_id: data.telegram_id ? String(data.telegram_id) : null,
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      res.status(201).json({
        success: true,
        data: userData as User
      });
    } else {
      // Создаем пользователя без telegram_id (временный пользователь)
      const { data: insertData, error } = await supabase
        .from('users')
        .insert({
          telegram_id: null,
          username: username || null,
          first_name: first_name || null,
          last_name: last_name || null,
          phone: phone || null
        })
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      if (!insertData || insertData.length === 0) {
        throw new Error('User created but no data returned');
      }

      const data = insertData[0];

      // Ручная конвертация BigInt в строку перед сериализацией
      const userData: any = {
        id: data.id,
        telegram_id: data.telegram_id ? String(data.telegram_id) : null,
        username: data.username,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
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
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    
    // Безопасная сериализация ошибки (без BigInt)
    let errorMessage = error.message || 'Failed to create user';
    if (typeof errorMessage === 'object') {
      try {
        errorMessage = JSON.stringify(errorMessage, (key, value) => {
          if (typeof value === 'bigint') {
            return value.toString();
          }
          return value;
        });
      } catch (e) {
        errorMessage = 'Failed to create user';
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: String(errorMessage)
    });
  }
}

