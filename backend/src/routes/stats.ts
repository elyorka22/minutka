// ============================================
// Statistics Routes
// ============================================

import express from 'express';
import { getStats, getRestaurantStats, getRestaurantsStats } from '../controllers/stats';
import { requireStaffAuth, requireSuperAdmin } from '../middleware/auth';

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

/**
 * GET /api/stats/restaurants
 * Получить статистику по всем ресторанам за месяц (только для супер-админа)
 */
router.get('/restaurants', requireStaffAuth, requireSuperAdmin, getRestaurantsStats);

export default router;

