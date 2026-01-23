// ============================================
// Restaurants Routes
// ============================================

import express from 'express';
import { getRestaurants, getRestaurantById, createRestaurant, updateRestaurant, deleteRestaurant } from '../controllers/restaurants';

const router = express.Router();

/**
 * GET /api/restaurants
 * Получить список активных ресторанов
 * Query params: featured (boolean) - только топовые рестораны
 */
router.get('/', getRestaurants);

/**
 * POST /api/restaurants
 * Создать новый ресторан
 */
router.post('/', createRestaurant);

/**
 * GET /api/restaurants/:id
 * Получить детали ресторана по ID
 */
router.get('/:id', getRestaurantById);

/**
 * PATCH /api/restaurants/:id
 * Обновить ресторан
 */
router.patch('/:id', updateRestaurant);

/**
 * DELETE /api/restaurants/:id
 * Удалить ресторан
 */
router.delete('/:id', deleteRestaurant);

export default router;



