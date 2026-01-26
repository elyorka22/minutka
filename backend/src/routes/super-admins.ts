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
import { requireStaffAuth, requireSuperAdmin } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/super-admins
 * Получить всех супер-админов
 * Только для супер-админов
 */
router.get('/', requireStaffAuth, requireSuperAdmin, getSuperAdmins);

/**
 * GET /api/super-admins/:id
 * Получить супер-админа по ID
 * Только для супер-админов
 */
router.get('/:id', requireStaffAuth, requireSuperAdmin, getSuperAdminById);

/**
 * POST /api/super-admins
 * Создать нового супер-админа
 * Только для супер-админов
 */
router.post('/', requireStaffAuth, requireSuperAdmin, createSuperAdmin);

/**
 * PATCH /api/super-admins/:id
 * Обновить супер-админа
 * Только для супер-админов
 */
router.patch('/:id', requireStaffAuth, requireSuperAdmin, updateSuperAdmin);

/**
 * DELETE /api/super-admins/:id
 * Удалить супер-админа
 * Только для супер-админов
 */
router.delete('/:id', requireStaffAuth, requireSuperAdmin, deleteSuperAdmin);

export default router;

