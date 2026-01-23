// ============================================
// Users Routes
// ============================================

import express from 'express';
import { getUsers, getUserById } from '../controllers/users';

const router = express.Router();

/**
 * GET /api/users
 * Получить список пользователей
 */
router.get('/', getUsers);

/**
 * GET /api/users/:id
 * Получить пользователя по ID
 */
router.get('/:id', getUserById);

export default router;

