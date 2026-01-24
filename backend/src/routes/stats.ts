// ============================================
// Statistics Routes
// ============================================

import express from 'express';
import { getStats, getRestaurantStats } from '../controllers/stats';

const router = express.Router();

/**
 * GET /api/stats
 * Получить статистику для дашборда
 */
router.get('/', getStats);

/**
 * GET /api/stats/restaurant/:restaurantId
 * Получить статистику для конкретного ресторана
 */
router.get('/restaurant/:restaurantId', getRestaurantStats);

export default router;

