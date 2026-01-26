// ============================================
// Chefs Routes
// ============================================

import { Router } from 'express';
import { getChefs, getChefById, createChef, updateChef, deleteChef } from '../controllers/chefs';
import { requireStaffAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/chefs
 * Получить всех поваров (с фильтрацией по ресторану)
 * Query params: restaurant_id (optional)
 * Только для сотрудников
 */
router.get('/', requireStaffAuth, getChefs);

/**
 * GET /api/chefs/:id
 * Получить повара по ID
 * Только для сотрудников
 */
router.get('/:id', requireStaffAuth, getChefById);

/**
 * POST /api/chefs
 * Создать нового повара
 * Только для сотрудников
 */
router.post('/', requireStaffAuth, createChef);

/**
 * PATCH /api/chefs/:id
 * Обновить повара
 * Только для сотрудников
 */
router.patch('/:id', requireStaffAuth, updateChef);

/**
 * DELETE /api/chefs/:id
 * Удалить повара
 * Только для сотрудников
 */
router.delete('/:id', requireStaffAuth, deleteChef);

export default router;



