// ============================================
// Store Categories Routes
// ============================================

import express from 'express';
import { 
  getStoreCategories, 
  getStoreCategoryById, 
  createStoreCategory, 
  updateStoreCategory, 
  deleteStoreCategory 
} from '../controllers/storeCategories';
import { requireStaffAuth } from '../middleware/auth';
import { createUpdateLimiter } from '../middleware/rateLimit';

const router = express.Router();

/**
 * GET /api/store-categories
 * Получить категории магазина
 * Query params: restaurant_id (required)
 * Публичный доступ (для активных категорий)
 */
router.get('/', getStoreCategories);

/**
 * GET /api/store-categories/:id
 * Получить категорию по ID
 * Публичный доступ
 */
router.get('/:id', getStoreCategoryById);

/**
 * POST /api/store-categories
 * Создать новую категорию
 * Только для сотрудников
 */
router.post('/', requireStaffAuth, createUpdateLimiter, createStoreCategory);

/**
 * PATCH /api/store-categories/:id
 * Обновить категорию
 * Только для сотрудников
 */
router.patch('/:id', requireStaffAuth, createUpdateLimiter, updateStoreCategory);

/**
 * DELETE /api/store-categories/:id
 * Удалить категорию
 * Только для сотрудников
 */
router.delete('/:id', requireStaffAuth, deleteStoreCategory);

export default router;

