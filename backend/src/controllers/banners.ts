// ============================================
// Banners Controller
// ============================================

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { Banner } from '../types';

/**
 * GET /api/banners
 * Получить активные баннеры
 * Query params: position - фильтр по позиции (homepage, restaurant_page, recommended)
 */
export async function getBanners(req: Request, res: Response) {
  try {
    const { position } = req.query;

    let query = supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Фильтр по позиции
    if (position && typeof position === 'string') {
      query = query.eq('position', position);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data as Banner[]
    });
  } catch (error: any) {
    console.error('Error fetching banners:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch banners',
      message: error.message
    });
  }
}


