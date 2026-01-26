// ============================================
// Menu Items Routes
// ============================================

import express from 'express';
import { getMenuItems, getMenuItemById, createMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/menu';
import { requireStaffAuth } from '../middleware/auth';
import { createUpdateLimiter } from '../middleware/rateLimit';

const router = express.Router();

/**
 * GET /api/menu
 * Получить меню ресторана
 * Query params: restaurant_id (required)
 * Публичный доступ (не требует аутентификации)
 */
router.get('/', getMenuItems);

/**
 * GET /api/menu/:id
 * Получить блюдо по ID
 * Публичный доступ
 */
router.get('/:id', getMenuItemById);

/**
 * POST /api/menu
 * Создать новое блюдо
 * Только для сотрудников
 */
router.post('/', requireStaffAuth, createUpdateLimiter, createMenuItem);

/**
 * PATCH /api/menu/:id
 * Обновить блюдо
 * Только для сотрудников
 */
router.patch('/:id', requireStaffAuth, createUpdateLimiter, updateMenuItem);

/**
 * DELETE /api/menu/:id
 * Удалить блюдо
 * Только для сотрудников
 */
router.delete('/:id', requireStaffAuth, deleteMenuItem);

export default router;


