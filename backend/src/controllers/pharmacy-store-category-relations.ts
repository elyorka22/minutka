// ============================================
// Pharmacy/Store-Category Relations Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/auth';
import { validateUuid } from '../utils/validation';
import { Logger } from '../services/logger';

/**
 * GET /api/pharmacy-store-category-relations
 * Получить все связи аптек/магазинов с категориями
 * Query params: pharmacy_store_id, category_id
 */
export async function getPharmacyStoreCategoryRelations(req: AuthenticatedRequest, res: Response) {
  try {
    const { pharmacy_store_id, category_id } = req.query;

    let query = supabase
      .from('pharmacy_store_category_relations')
      .select(`
        *,
        pharmacies_stores(id, name, phone, description),
        restaurant_categories(id, name, image_url)
      `);

    if (pharmacy_store_id) {
      if (!validateUuid(pharmacy_store_id as string)) {
        return res.status(400).json({ success: false, error: 'Invalid pharmacy_store_id format' });
      }
      query = query.eq('pharmacy_store_id', pharmacy_store_id);
    }

    if (category_id) {
      if (!validateUuid(category_id as string)) {
        return res.status(400).json({ success: false, error: 'Invalid category_id format' });
      }
      query = query.eq('category_id', category_id);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({ success: true, data });
  } catch (error: any) {
    Logger.error('Error fetching pharmacy-store-category relations', error, { userId: req.user?.telegram_id, userRole: req.user?.role, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to fetch relations', message: error.message });
  }
}

/**
 * POST /api/pharmacy-store-category-relations
 * Создать связь между аптекой/магазином и категорией
 */
export async function createPharmacyStoreCategoryRelation(req: AuthenticatedRequest, res: Response) {
  try {
    const { pharmacy_store_id, category_id } = req.body;

    // Валидация
    if (!validateUuid(pharmacy_store_id)) {
      return res.status(400).json({ success: false, error: 'Invalid pharmacy_store_id format' });
    }

    if (!validateUuid(category_id)) {
      return res.status(400).json({ success: false, error: 'Invalid category_id format' });
    }

    // Проверяем, существует ли аптека/магазин
    const { data: pharmacyStore, error: pharmacyStoreError } = await supabase
      .from('pharmacies_stores')
      .select('id')
      .eq('id', pharmacy_store_id)
      .single();

    if (pharmacyStoreError || !pharmacyStore) {
      return res.status(404).json({ success: false, error: 'Pharmacy/Store not found' });
    }

    // Проверяем, существует ли категория
    const { data: category, error: categoryError } = await supabase
      .from('restaurant_categories')
      .select('id')
      .eq('id', category_id)
      .single();

    if (categoryError || !category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    // Создаем связь
    const { data, error } = await supabase
      .from('pharmacy_store_category_relations')
      .insert({
        pharmacy_store_id,
        category_id,
      })
      .select(`
        *,
        pharmacies_stores(id, name, phone, description),
        restaurant_categories(id, name, image_url)
      `)
      .single();

    if (error) {
      // Если связь уже существует, возвращаем существующую
      if (error.code === '23505') { // Unique violation
        const { data: existing } = await supabase
          .from('pharmacy_store_category_relations')
          .select(`
            *,
            pharmacies_stores(id, name, phone, description),
            restaurant_categories(id, name, image_url)
          `)
          .eq('pharmacy_store_id', pharmacy_store_id)
          .eq('category_id', category_id)
          .single();

        if (existing) {
          Logger.logCreate('pharmacy_store_category_relation', existing.id, req.user?.telegram_id, req.user?.role, req.ip);
          return res.json({ success: true, data: existing });
        }
      }
      throw error;
    }

    Logger.logCreate('pharmacy_store_category_relation', data.id, req.user?.telegram_id, req.user?.role, req.ip);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    Logger.error('Error creating pharmacy-store-category relation', error, { userId: req.user?.telegram_id, userRole: req.user?.role, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to create relation', message: error.message });
  }
}

/**
 * DELETE /api/pharmacy-store-category-relations/:id
 * Удалить связь между аптекой/магазином и категорией
 */
export async function deletePharmacyStoreCategoryRelation(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!validateUuid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid id format' });
    }

    const { error } = await supabase
      .from('pharmacy_store_category_relations')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    Logger.logDelete('pharmacy_store_category_relation', id, req.user?.telegram_id, req.user?.role, req.ip);
    res.json({ success: true, message: 'Relation deleted successfully' });
  } catch (error: any) {
    Logger.error('Error deleting pharmacy-store-category relation', error, { userId: req.user?.telegram_id, userRole: req.user?.role, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to delete relation', message: error.message });
  }
}

/**
 * DELETE /api/pharmacy-store-category-relations
 * Удалить связь по pharmacy_store_id и category_id
 */
export async function deletePharmacyStoreCategoryRelationByIds(req: AuthenticatedRequest, res: Response) {
  try {
    const { pharmacy_store_id, category_id } = req.body;

    if (!validateUuid(pharmacy_store_id)) {
      return res.status(400).json({ success: false, error: 'Invalid pharmacy_store_id format' });
    }

    if (!validateUuid(category_id)) {
      return res.status(400).json({ success: false, error: 'Invalid category_id format' });
    }

    const { data, error } = await supabase
      .from('pharmacy_store_category_relations')
      .delete()
      .eq('pharmacy_store_id', pharmacy_store_id)
      .eq('category_id', category_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      Logger.logDelete('pharmacy_store_category_relation', data.id, req.user?.telegram_id, req.user?.role, req.ip);
    }
    res.json({ success: true, message: 'Relation deleted successfully' });
  } catch (error: any) {
    Logger.error('Error deleting pharmacy-store-category relation by ids', error, { userId: req.user?.telegram_id, userRole: req.user?.role, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to delete relation', message: error.message });
  }
}

