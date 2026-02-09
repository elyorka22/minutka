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
import { requireStaffAuth, requireSuperAdmin, requireRestaurantAdmin } from '../middleware/auth';

const router = Router();

// GET - супер-админы видят всех, ресторан-админы только своих
router.get('/', requireStaffAuth, requireRestaurantAdmin, getCouriers);
router.get('/active', requireStaffAuth, requireRestaurantAdmin, getActiveCouriers);
// POST - супер-админы и ресторан-админы могут создавать
router.post('/', requireStaffAuth, requireRestaurantAdmin, createCourier);
// PUT и DELETE - только супер-админы
router.put('/:id', requireStaffAuth, requireSuperAdmin, updateCourier);
router.delete('/:id', requireStaffAuth, requireSuperAdmin, deleteCourier);

export default router;

