// ============================================
// Menu Items Routes
// ============================================

import express from 'express';
import { getMenuItems, getMenuItemById, createMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/menu';

const router = express.Router();

/**
 * GET /api/menu
 * Получить меню ресторана
 * Query params: restaurant_id (required)
 */
router.get('/', getMenuItems);

/**
 * GET /api/menu/:id
 * Получить блюдо по ID
 */
router.get('/:id', getMenuItemById);

/**
 * POST /api/menu
 * Создать новое блюдо
 */
router.post('/', createMenuItem);

/**
 * PATCH /api/menu/:id
 * Обновить блюдо
 */
router.patch('/:id', updateMenuItem);

/**
 * DELETE /api/menu/:id
 * Удалить блюдо
 */
router.delete('/:id', deleteMenuItem);

export default router;

