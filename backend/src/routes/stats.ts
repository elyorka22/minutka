// ============================================
// Statistics Routes
// ============================================

import express from 'express';
import { getStats } from '../controllers/stats';

const router = express.Router();

/**
 * GET /api/stats
 * Получить статистику для дашборда
 */
router.get('/', getStats);

export default router;

