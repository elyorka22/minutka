// ============================================
// Banners Controller
// ============================================

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { Banner } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';
import { validateString, validateUrl } from '../utils/validation';
import { Logger } from '../services/logger';

/**
 * GET /api/banners
 * Получить баннеры
 * Query params: 
 *   - position - фильтр по позиции (homepage, restaurant_page, recommended)
 *   - all - если 'true', возвращает все баннеры (включая неактивные), иначе только активные
 */
export async function getBanners(req: Request, res: Response) {
  try {
    const { position, all } = req.query;

    let query = supabase
      .from('banners')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Если не запрошены все баннеры, показываем только активные
    if (all !== 'true') {
      query = query.eq('is_active', true);
    }

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

/**
 * POST /api/banners
 * Создать новый баннер
 */
export async function createBanner(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id, title, image_url, link_url, position, is_active, display_order } = req.body;

    // Валидация
    if (!image_url) {
      return res.status(400).json({
        success: false,
        error: 'image_url is required'
      });
    }

    if (!validateUrl(image_url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image_url format'
      });
    }

    if (link_url && !validateUrl(link_url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid link_url format'
      });
    }

    if (title && !validateString(title, 1, 255)) {
      return res.status(400).json({
        success: false,
        error: 'Title must be between 1 and 255 characters'
      });
    }

    const validPositions = ['homepage', 'restaurant_page', 'recommended'];
    if (position && !validPositions.includes(position)) {
      return res.status(400).json({
        success: false,
        error: `Invalid position. Must be one of: ${validPositions.join(', ')}`
      });
    }

    const { data, error } = await supabase
      .from('banners')
      .insert({
        restaurant_id: restaurant_id || null,
        title: title || null,
        image_url,
        link_url: link_url || null,
        position: position || 'homepage',
        is_active: is_active !== undefined ? is_active : true,
        display_order: display_order || 0,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    Logger.logCreate('banner', data.id, req.user?.telegram_id, req.user?.role, req.ip);

    res.status(201).json({
      success: true,
      data: data as Banner
    });
  } catch (error: any) {
    console.error('Error creating banner:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create banner',
      message: error.message
    });
  }
}

/**
 * PATCH /api/banners/:id
 * Обновить баннер
 */
export async function updateBanner(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { restaurant_id, title, image_url, link_url, position, is_active, display_order } = req.body;

    // Валидация
    if (image_url && !validateUrl(image_url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image_url format'
      });
    }

    if (link_url && !validateUrl(link_url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid link_url format'
      });
    }

    if (title !== undefined && title !== null && !validateString(title, 0, 255)) {
      return res.status(400).json({
        success: false,
        error: 'Title must be less than 255 characters'
      });
    }

    const validPositions = ['homepage', 'restaurant_page', 'recommended'];
    if (position && !validPositions.includes(position)) {
      return res.status(400).json({
        success: false,
        error: `Invalid position. Must be one of: ${validPositions.join(', ')}`
      });
    }

    const updateData: any = {};
    if (restaurant_id !== undefined) updateData.restaurant_id = restaurant_id;
    if (title !== undefined) updateData.title = title || null;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (link_url !== undefined) updateData.link_url = link_url || null;
    if (position !== undefined) updateData.position = position;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (display_order !== undefined) updateData.display_order = display_order;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('banners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Banner not found'
      });
    }

    Logger.logUpdate('banner', id, req.user?.telegram_id, req.user?.role, req.ip, updateData);

    res.json({
      success: true,
      data: data as Banner
    });
  } catch (error: any) {
    console.error('Error updating banner:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update banner',
      message: error.message
    });
  }
}

/**
 * DELETE /api/banners/:id
 * Удалить баннер
 */
export async function deleteBanner(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    Logger.logDelete('banner', id, req.user?.telegram_id, req.user?.role, req.ip);

    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting banner:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete banner',
      message: error.message
    });
  }
}


