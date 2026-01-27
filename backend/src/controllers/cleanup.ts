// ============================================
// Cleanup Controller - Автоматическая очистка старых архивных заказов
// ============================================

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * POST /api/cleanup/old-orders
 * Удалить архивные заказы старше 20 дней
 * Можно вызывать через cron job или вручную
 */
export async function deleteOldArchivedOrders(req: Request, res: Response) {
  try {
    // Вызываем функцию PostgreSQL для удаления старых архивных заказов
    const { data, error } = await supabase.rpc('delete_old_archived_orders');

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: `Deleted ${data || 0} old archived orders`,
      deletedCount: data || 0
    });
  } catch (error: any) {
    console.error('Error deleting old archived orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete old archived orders',
      message: error.message
    });
  }
}


