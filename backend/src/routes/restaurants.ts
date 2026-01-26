// ============================================
// Restaurants Routes
// ============================================

import express from 'express';
import { getRestaurants, getRestaurantById, createRestaurant, updateRestaurant, deleteRestaurant } from '../controllers/restaurants';
import { requireStaffAuth } from '../middleware/auth';
import { createUpdateLimiter } from '../middleware/rateLimit';

const router = express.Router();

/**
 * GET /api/restaurants
 * Получить список активных ресторанов
 * Query params: featured (boolean) - только топовые рестораны
 * Публичный доступ
 */
router.get('/', getRestaurants);

/**
 * POST /api/restaurants
 * Создать новый ресторан
 * Только для сотрудников
 */
router.post('/', requireStaffAuth, createUpdateLimiter, createRestaurant);

/**
 * GET /api/restaurants/:id
 * Получить детали ресторана по ID
 * Публичный доступ
 */
router.get('/:id', getRestaurantById);

/**
 * PATCH /api/restaurants/:id
 * Обновить ресторан
 * Только для сотрудников
 */
router.patch('/:id', requireStaffAuth, createUpdateLimiter, updateRestaurant);

/**
 * DELETE /api/restaurants/:id
 * Удалить ресторан
 * Только для сотрудников
 */
router.delete('/:id', requireStaffAuth, deleteRestaurant);

export default router;



