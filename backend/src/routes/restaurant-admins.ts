// ============================================
// Restaurant Admins Routes
// ============================================

import express from 'express';
import { getRestaurantAdmins, getRestaurantAdminById, createRestaurantAdmin, updateRestaurantAdmin, deleteRestaurantAdmin } from '../controllers/restaurant-admins';
import { requireStaffAuth, requireSuperAdmin } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/restaurant-admins
 * Получить список админов ресторана
 * Query params: restaurant_id (optional)
 * Только для сотрудников
 */
router.get('/', requireStaffAuth, getRestaurantAdmins);

/**
 * GET /api/restaurant-admins/:id
 * Получить админа по ID
 * Только для сотрудников
 */
router.get('/:id', requireStaffAuth, getRestaurantAdminById);

/**
 * POST /api/restaurant-admins
 * Создать нового админа ресторана
 * Только для супер-админов
 */
router.post('/', requireStaffAuth, requireSuperAdmin, createRestaurantAdmin);

/**
 * PATCH /api/restaurant-admins/:id
 * Обновить админа ресторана
 * Только для сотрудников
 */
router.patch('/:id', requireStaffAuth, updateRestaurantAdmin);

/**
 * DELETE /api/restaurant-admins/:id
 * Удалить админа ресторана
 * Только для супер-админов
 */
router.delete('/:id', requireStaffAuth, requireSuperAdmin, deleteRestaurantAdmin);

export default router;


