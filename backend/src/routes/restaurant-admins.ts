// ============================================
// Restaurant Admins Routes
// ============================================

import express from 'express';
import { getRestaurantAdmins, getRestaurantAdminById, createRestaurantAdmin, updateRestaurantAdmin, deleteRestaurantAdmin } from '../controllers/restaurant-admins';

const router = express.Router();

/**
 * GET /api/restaurant-admins
 * Получить список админов ресторана
 * Query params: restaurant_id (optional)
 */
router.get('/', getRestaurantAdmins);

/**
 * GET /api/restaurant-admins/:id
 * Получить админа по ID
 */
router.get('/:id', getRestaurantAdminById);

/**
 * POST /api/restaurant-admins
 * Создать нового админа ресторана
 */
router.post('/', createRestaurantAdmin);

/**
 * PATCH /api/restaurant-admins/:id
 * Обновить админа ресторана
 */
router.patch('/:id', updateRestaurantAdmin);

/**
 * DELETE /api/restaurant-admins/:id
 * Удалить админа ресторана
 */
router.delete('/:id', deleteRestaurantAdmin);

export default router;

