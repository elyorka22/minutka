// ============================================
// Couriers Routes
// ============================================

import { Router } from 'express';
import {
  getCouriers,
  createCourier,
  updateCourier,
  deleteCourier,
  getActiveCouriers
} from '../controllers/couriers';
import { requireSuperAdminAuth } from '../middleware/auth';

const router = Router();

// Все маршруты требуют аутентификации super_admin
router.get('/', requireSuperAdminAuth, getCouriers);
router.get('/active', requireSuperAdminAuth, getActiveCouriers);
router.post('/', requireSuperAdminAuth, createCourier);
router.put('/:id', requireSuperAdminAuth, updateCourier);
router.delete('/:id', requireSuperAdminAuth, deleteCourier);

export default router;

