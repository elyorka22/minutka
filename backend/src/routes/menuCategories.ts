// ============================================
// Menu Categories Routes
// ============================================

import express from 'express';
import { 
  getMenuCategories, 
  getMenuCategoryById, 
  createMenuCategory, 
  updateMenuCategory, 
  deleteMenuCategory 
} from '../controllers/menuCategories';
import { requireStaffAuth } from '../middleware/auth';
import { createUpdateLimiter } from '../middleware/rateLimit';

const router = express.Router();

/**
 * GET /api/menu-categories
 * Получить категории меню ресторана
 * Query params: restaurant_id (required)
 * Публичный доступ (для активных категорий)
 */
router.get('/', getMenuCategories);

/**
 * GET /api/menu-categories/:id
 * Получить категорию по ID
 * Публичный доступ
 */
router.get('/:id', getMenuCategoryById);

/**
 * POST /api/menu-categories
 * Создать новую категорию
 * Только для сотрудников
 */
router.post('/', requireStaffAuth, createUpdateLimiter, createMenuCategory);

/**
 * PATCH /api/menu-categories/:id
 * Обновить категорию
 * Только для сотрудников
 */
router.patch('/:id', requireStaffAuth, createUpdateLimiter, updateMenuCategory);

/**
 * DELETE /api/menu-categories/:id
 * Удалить категорию
 * Только для сотрудников
 */
router.delete('/:id', requireStaffAuth, deleteMenuCategory);

export default router;

