// ============================================
// Users Routes
// ============================================

import express from 'express';
import { getUsers, getUserById, getUserByTelegramId, createUser } from '../controllers/users';

const router = express.Router();

/**
 * POST /api/users
 * Создать нового пользователя
 */
router.post('/', createUser);

/**
 * GET /api/users
 * Получить список пользователей или пользователя по telegram_id
 */
router.get('/', (req, res, next) => {
  if (req.query.telegram_id) {
    return getUserByTelegramId(req, res);
  }
  return getUsers(req, res);
});

/**
 * GET /api/users/:id
 * Получить пользователя по ID
 */
router.get('/:id', getUserById);

export default router;

