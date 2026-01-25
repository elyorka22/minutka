// ============================================
// Authentication Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export interface AuthenticatedRequest extends Request {
  user?: {
    telegram_id: string;
    role: 'super_admin' | 'restaurant_admin' | 'chef' | 'mijoz';
    userData: any;
    restaurant_id?: string; // Для админов ресторана и поваров
  };
}

/**
 * Middleware для проверки аутентификации сотрудника
 * Ожидает telegram_id в query или body
 */
export async function requireStaffAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const telegram_id = req.query.telegram_id as string || req.body.telegram_id;

    if (!telegram_id) {
      return res.status(401).json({
        success: false,
        error: 'telegram_id is required'
      });
    }

    const telegramId = BigInt(telegram_id);

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

    // Определяем роль
    if (superAdminResult.data && !superAdminResult.error) {
      req.user = {
        telegram_id: telegram_id,
        role: 'super_admin',
        userData: superAdminResult.data,
      };
      return next();
    } else if (chefResult.data && !chefResult.error) {
      req.user = {
        telegram_id: telegram_id,
        role: 'chef',
        userData: chefResult.data,
        restaurant_id: chefResult.data.restaurant_id,
      };
      return next();
    } else if (restaurantAdminResult.data && !restaurantAdminResult.error) {
      req.user = {
        telegram_id: telegram_id,
        role: 'restaurant_admin',
        userData: restaurantAdminResult.data,
        restaurant_id: restaurantAdminResult.data.restaurant_id,
      };
      return next();
    }

    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Staff member not found or inactive'
    });
  } catch (error: any) {
    console.error('Error in requireStaffAuth:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: error.message
    });
  }
}

/**
 * Middleware для проверки, что пользователь является супер-админом
 */
export function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Super admin access required'
    });
  }

  next();
}

/**
 * Middleware для проверки, что пользователь является админом ресторана или супер-админом
 */
export function requireRestaurantAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'restaurant_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Restaurant admin or super admin access required'
    });
  }

  next();
}

/**
 * Middleware для проверки, что админ ресторана может редактировать только свой ресторан
 * Используется в контроллерах, где нужно проверить restaurant_id
 */
export function checkRestaurantAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Супер-админы имеют доступ ко всем ресторанам
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Для админов ресторана и поваров проверяем restaurant_id
  const restaurantId = req.params.id || req.body.restaurant_id || req.query.restaurant_id;

  if (!restaurantId) {
    return res.status(400).json({
      success: false,
      error: 'restaurant_id is required'
    });
  }

  if (req.user.restaurant_id && req.user.restaurant_id !== restaurantId) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: You can only access your own restaurant'
    });
  }

  next();
}

