// ============================================
// Auth Routes
// ============================================

import express from 'express';
import { getCurrentUser } from '../controllers/auth';

const router = express.Router();

/**
 * GET /api/auth/me
 * Получить информацию о текущем пользователе и его роли
 * Query params: telegram_id (required)
 */
router.get('/me', getCurrentUser);

export default router;

