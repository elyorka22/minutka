// ============================================
// Menu Item Category Relations Routes
// ============================================

import express from 'express';
import { getMenuItemCategories, setMenuItemCategories, getMenuItemsByCategory } from '../controllers/menuItemCategoryRelations';
import { requireStaffAuth } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/menu-items/:menuItemId/categories
 * Получить категории товара
 * Публичный доступ
 */
router.get('/:menuItemId/categories', getMenuItemCategories);

/**
 * POST /api/menu-items/:menuItemId/categories
 * Установить категории для товара
 * Только для сотрудников
 */
router.post('/:menuItemId/categories', requireStaffAuth, setMenuItemCategories);

/**
 * GET /api/categories/:categoryName/menu-items
 * Получить товары по категории
 * Публичный доступ
 */
router.get('/:categoryName/menu-items', getMenuItemsByCategory);

export default router;

