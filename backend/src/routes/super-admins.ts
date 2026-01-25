// ============================================
// Super Admins Routes
// ============================================

import { Router } from 'express';
import { createSuperAdmin, updateSuperAdminPassword } from '../controllers/super-admins';

const router = Router();

// POST /api/super-admins - Создать нового супер-админа
router.post('/', createSuperAdmin);

// PATCH /api/super-admins/:id/password - Обновить пароль
router.patch('/:id/password', updateSuperAdminPassword);

export default router;

