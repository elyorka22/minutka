// ============================================
// Banners Routes
// ============================================

import express from 'express';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../controllers/banners';
import { requireStaffAuth, requireSuperAdmin } from '../middleware/auth';
import { createUpdateLimiter } from '../middleware/rateLimit';

const router = express.Router();

/**
 * GET /api/banners
 * Получить баннеры
 * Query params: 
 *   - position (string) - фильтр по позиции
 *   - all (string) - если 'true', возвращает все баннеры (включая неактивные)
 */
router.get('/', getBanners);

/**
 * POST /api/banners
 * Создать новый баннер (только для супер-админов)
 */
router.post('/', requireStaffAuth, requireSuperAdmin, createUpdateLimiter, createBanner);

/**
 * PATCH /api/banners/:id
 * Обновить баннер (только для супер-админов)
 */
router.patch('/:id', requireStaffAuth, requireSuperAdmin, createUpdateLimiter, updateBanner);

/**
 * DELETE /api/banners/:id
 * Удалить баннер (только для супер-админов)
 */
router.delete('/:id', requireStaffAuth, requireSuperAdmin, createUpdateLimiter, deleteBanner);

export default router;



