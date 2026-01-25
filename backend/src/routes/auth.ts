// ============================================
// Auth Routes
// ============================================

import express from 'express';
import { getCurrentUser, loginStaff } from '../controllers/auth';

const router = express.Router();

/**
 * POST /api/auth/login
 * Вход для сотрудников (с паролем)
 * Body: { telegram_id: string, password: string }
 */
router.post('/login', loginStaff);

/**
 * GET /api/auth/me
 * Получить информацию о текущем пользователе и его роли
 * Query params: telegram_id (required)
 * Для клиентов (mijoz) - без пароля
 */
router.get('/me', getCurrentUser);

export default router;

