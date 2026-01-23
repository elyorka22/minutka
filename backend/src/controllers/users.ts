// ============================================
// Users Controller
// ============================================

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { User } from '../types';

/**
 * GET /api/users
 * Получить список пользователей
 */
export async function getUsers(req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data as User[]
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

    res.json({
      success: true,
      data: data as User
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

