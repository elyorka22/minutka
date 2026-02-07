// ============================================
// Menu Views Routes
// ============================================

import express from 'express';
import { trackMenuView, getMenuViewStatistics } from '../controllers/menuViews';
import { requireStaffAuth } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/menu-views
 * Отслеживание просмотра меню
 * Публичный доступ
 */
router.post('/', trackMenuView);

/**
 * GET /api/menu-views/statistics
 * Получить статистику просмотров меню
 * Требует аутентификации
 */
router.get('/statistics', requireStaffAuth, getMenuViewStatistics);

export default router;

