// ============================================
// Banners Routes
// ============================================

import express from 'express';
import { getBanners } from '../controllers/banners';

const router = express.Router();

/**
 * GET /api/banners
 * Получить активные баннеры
 * Query params: position (string) - фильтр по позиции
 */
router.get('/', getBanners);

export default router;



