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
import { requireStaffAuth, requireSuperAdmin } from '../middleware/auth';

const router = Router();

// Все маршруты требуют аутентификации super_admin
router.get('/', requireStaffAuth, requireSuperAdmin, getCouriers);
router.get('/active', requireStaffAuth, requireSuperAdmin, getActiveCouriers);
router.post('/', requireStaffAuth, requireSuperAdmin, createCourier);
router.put('/:id', requireStaffAuth, requireSuperAdmin, updateCourier);
router.delete('/:id', requireStaffAuth, requireSuperAdmin, deleteCourier);

export default router;

