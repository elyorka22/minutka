// ============================================
// Auth Routes
// ============================================

import express from 'express';
import { getCurrentUser, loginStaff, changePassword } from '../controllers/auth';
import { strictLimiter } from '../middleware/rateLimit';

const router = express.Router();

/**
 * POST /api/auth/login
 * Вход для сотрудников (с паролем)
 * Body: { telegram_id: string, password: string }
 * Защищено строгим rate limiting
 */
router.post('/login', strictLimiter, loginStaff);

/**
 * GET /api/auth/me
 * Получить информацию о текущем пользователе и его роли
 * Query params: telegram_id (required)
 * Для клиентов (mijoz) - без пароля
 */
router.get('/me', getCurrentUser);

/**
 * POST /api/auth/change-password
 * Изменить пароль сотрудника
 * Body: { telegram_id: string, old_password: string, new_password: string }
 */
router.post('/change-password', changePassword);

export default router;

