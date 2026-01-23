// ============================================
// Restaurants Routes
// ============================================

import express from 'express';
import { getRestaurants, getRestaurantById } from '../controllers/restaurants';

const router = express.Router();

/**
 * GET /api/restaurants
 * Получить список активных ресторанов
 * Query params: featured (boolean) - только топовые рестораны
 */
router.get('/', getRestaurants);

/**
 * GET /api/restaurants/:id
 * Получить детали ресторана по ID
 */
router.get('/:id', getRestaurantById);

export default router;



