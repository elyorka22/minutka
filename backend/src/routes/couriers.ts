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
import { requireSuperAdmin } from '../middleware/auth';

const router = Router();

// Все маршруты требуют аутентификации super_admin
router.get('/', requireSuperAdmin, getCouriers);
router.get('/active', requireSuperAdmin, getActiveCouriers);
router.post('/', requireSuperAdmin, createCourier);
router.put('/:id', requireSuperAdmin, updateCourier);
router.delete('/:id', requireSuperAdmin, deleteCourier);

export default router;

