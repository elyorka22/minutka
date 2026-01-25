// ============================================
// Super Admins Routes
// ============================================

import express from 'express';
import {
  getSuperAdmins,
  getSuperAdminById,
  createSuperAdmin,
  updateSuperAdmin,
  deleteSuperAdmin,
} from '../controllers/super-admins';

const router = express.Router();

/**
 * GET /api/super-admins
 * Получить всех супер-админов
 */
router.get('/', getSuperAdmins);

/**
 * GET /api/super-admins/:id
 * Получить супер-админа по ID
 */
router.get('/:id', getSuperAdminById);

/**
 * POST /api/super-admins
 * Создать нового супер-админа
 */
router.post('/', createSuperAdmin);

/**
 * PATCH /api/super-admins/:id
 * Обновить супер-админа
 */
router.patch('/:id', updateSuperAdmin);

/**
 * DELETE /api/super-admins/:id
 * Удалить супер-админа
 */
router.delete('/:id', deleteSuperAdmin);

export default router;

