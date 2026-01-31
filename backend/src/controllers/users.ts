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
      const { data: existing, error: existingError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .maybeSingle();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (existing) {
        // Пользователь уже существует, возвращаем его
        // Конвертируем BigInt в строку для JSON сериализации
        const userData = serializeBigInt(existing);
        
        // Используем JSON.stringify с кастомным replacer для гарантированной сериализации
        const serialized = JSON.parse(JSON.stringify(userData, (key, value) => {
          if (typeof value === 'bigint') {
            return value.toString();
          }
          return value;
        }));
        
        return res.json({
          success: true,
          data: serialized as User
        });
      }

      // Создаем нового пользователя с telegram_id
      const { data, error } = await supabase
        .from('users')
        .insert({
          telegram_id: telegramId,
          username: username || null,
          first_name: first_name || null,
          last_name: last_name || null,
          phone: phone || null
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('User created but no data returned');
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

      res.status(201).json({
        success: true,
        data: serialized as User
      });
    } else {
      // Создаем пользователя без telegram_id (временный пользователь)
      const { data, error } = await supabase
        .from('users')
        .insert({
          telegram_id: null,
          username: username || null,
          first_name: first_name || null,
          last_name: last_name || null,
          phone: phone || null
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('User created but no data returned');
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

      res.status(201).json({
        success: true,
        data: serialized as User
      });
    }
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: error.message
    });
  }
}

