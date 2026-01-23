// ============================================
// Restaurants Controller
// ============================================

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { Restaurant } from '../types';

/**
 * GET /api/restaurants
 * Получить список активных ресторанов
 */
export async function getRestaurants(req: Request, res: Response) {
  try {
    const { featured } = req.query;

    let query = supabase
      .from('restaurants')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('name', { ascending: true });

    // Если запрашивают только топовые рестораны
    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data as Restaurant[]
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
 */
export async function getRestaurantById(req: Request, res: Response) {
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
 */
export async function createRestaurant(req: Request, res: Response) {
  try {
    const { name, description, phone, image_url, is_active, is_featured, admin_telegram_id } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    // Создаем ресторан
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert({
        name,
        description: description || null,
        phone: phone || null,
        image_url: image_url || null,
        is_active: is_active ?? true,
        is_featured: is_featured ?? false,
        telegram_chat_id: null
      })
      .select()
      .single();

    if (restaurantError) {
      throw restaurantError;
    }

    // Если указан admin_telegram_id, создаем админа ресторана
    if (admin_telegram_id) {
      try {
        const { error: adminError } = await supabase
          .from('restaurant_admins')
          .insert({
            restaurant_id: restaurant.id,
            telegram_id: BigInt(admin_telegram_id),
            username: null,
            first_name: null,
            last_name: null,
            is_active: true
          });

        if (adminError) {
          console.error('Error creating restaurant admin:', adminError);
          // Не прерываем создание ресторана, только логируем ошибку
        } else {
          console.log(`Restaurant admin created for restaurant ${restaurant.id} with telegram_id ${admin_telegram_id}`);
        }
      } catch (adminErr: any) {
        console.error('Error creating restaurant admin:', adminErr);
        // Не прерываем создание ресторана
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
 */
export async function updateRestaurant(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, phone, image_url, is_active, is_featured } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (phone !== undefined) updateData.phone = phone;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_featured !== undefined) updateData.is_featured = is_featured;

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
 */
export async function deleteRestaurant(req: Request, res: Response) {
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


