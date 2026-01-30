// ============================================
// Pharmacies/Stores Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/auth';
import { validateString, validatePhone, validateUuid } from '../utils/validation';
import { Logger } from '../services/logger';
import { PharmacyStore } from '../types';

/**
 * GET /api/pharmacies-stores
 * Получить все аптеки/магазины
 */
export async function getPharmaciesStores(req: AuthenticatedRequest, res: Response) {
  try {
    const { active } = req.query;

    let query = supabase
      .from('pharmacies_stores')
      .select('*')
      .order('created_at', { ascending: false });

    if (active === 'true') {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Добавляем заголовки кеширования для публичных данных (кеш на 2 минуты)
    res.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
    
    res.json({ success: true, data: data as PharmacyStore[] });
  } catch (error: any) {
    Logger.error('Error fetching pharmacies/stores', error, { userId: req.user?.telegram_id, userRole: req.user?.role, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to fetch pharmacies/stores', message: error.message });
  }
}

/**
 * GET /api/pharmacies-stores/:id
 * Получить аптеку/магазин по ID
 */
export async function getPharmacyStoreById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!validateUuid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid id format' });
    }

    const { data, error } = await supabase
      .from('pharmacies_stores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ success: false, error: 'Pharmacy/Store not found' });
    }

    res.json({ success: true, data: data as PharmacyStore });
  } catch (error: any) {
    Logger.error('Error fetching pharmacy/store', error, { userId: req.user?.telegram_id, userRole: req.user?.role, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to fetch pharmacy/store', message: error.message });
  }
}

/**
 * POST /api/pharmacies-stores
 * Создать новую аптеку/магазин
 */
export async function createPharmacyStore(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, description, phone, working_hours, is_active } = req.body;

    // Валидация
    if (!validateString(name, 1, 255)) {
      return res.status(400).json({ success: false, error: 'Invalid name' });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({ success: false, error: 'Invalid phone number' });
    }

    if (description !== undefined && description !== null && !validateString(description, 0, 2000)) {
      return res.status(400).json({ success: false, error: 'Invalid description' });
    }

    const { data, error } = await supabase
      .from('pharmacies_stores')
      .insert({
        name,
        description: description || null,
        phone,
        working_hours: working_hours || null,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    Logger.logCreate('pharmacy_store', data.id, req.user?.telegram_id, req.user?.role, req.ip);
    res.status(201).json({ success: true, data: data as PharmacyStore });
  } catch (error: any) {
    Logger.error('Error creating pharmacy/store', error, { userId: req.user?.telegram_id, userRole: req.user?.role, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to create pharmacy/store', message: error.message });
  }
}

/**
 * PATCH /api/pharmacies-stores/:id
 * Обновить аптеку/магазин
 */
export async function updatePharmacyStore(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, phone, working_hours, is_active } = req.body;

    if (!validateUuid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid id format' });
    }

    const updateData: any = {};

    if (name !== undefined) {
      if (!validateString(name, 1, 255)) {
        return res.status(400).json({ success: false, error: 'Invalid name' });
      }
      updateData.name = name;
    }

    if (phone !== undefined) {
      if (!validatePhone(phone)) {
        return res.status(400).json({ success: false, error: 'Invalid phone number' });
      }
      updateData.phone = phone;
    }

    if (description !== undefined) {
      if (description !== null && !validateString(description, 0, 2000)) {
        return res.status(400).json({ success: false, error: 'Invalid description' });
      }
      updateData.description = description;
    }

    if (working_hours !== undefined) {
      updateData.working_hours = working_hours;
    }

    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }

    const { data, error } = await supabase
      .from('pharmacies_stores')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ success: false, error: 'Pharmacy/Store not found' });
    }

    Logger.logUpdate('pharmacy_store', id, req.user?.telegram_id, req.user?.role, req.ip, updateData);
    res.json({ success: true, data: data as PharmacyStore });
  } catch (error: any) {
    Logger.error('Error updating pharmacy/store', error, { userId: req.user?.telegram_id, userRole: req.user?.role, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to update pharmacy/store', message: error.message });
  }
}

/**
 * DELETE /api/pharmacies-stores/:id
 * Удалить аптеку/магазин
 */
export async function deletePharmacyStore(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!validateUuid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid id format' });
    }

    const { error } = await supabase
      .from('pharmacies_stores')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    Logger.logDelete('pharmacy_store', id, req.user?.telegram_id, req.user?.role, req.ip);
    res.json({ success: true, message: 'Pharmacy/Store deleted successfully' });
  } catch (error: any) {
    Logger.error('Error deleting pharmacy/store', error, { userId: req.user?.telegram_id, userRole: req.user?.role, ip: req.ip });
    res.status(500).json({ success: false, error: 'Failed to delete pharmacy/store', message: error.message });
  }
}

