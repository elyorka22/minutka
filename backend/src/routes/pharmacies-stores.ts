// ============================================
// Pharmacies/Stores Routes
// ============================================

import { Router } from 'express';
import {
  getPharmaciesStores,
  getPharmacyStoreById,
  createPharmacyStore,
  updatePharmacyStore,
  deletePharmacyStore,
} from '../controllers/pharmacies-stores';
import { requireStaffAuth, requireSuperAdmin } from '../middleware/auth';
import { createUpdateLimiter } from '../middleware/rateLimit';

const router = Router();

// GET /api/pharmacies-stores - Получить все аптеки/магазины
router.get('/', getPharmaciesStores);

// GET /api/pharmacies-stores/:id - Получить аптеку/магазин по ID
router.get('/:id', getPharmacyStoreById);

// POST /api/pharmacies-stores - Создать новую аптеку/магазин
router.post('/', requireStaffAuth, requireSuperAdmin, createUpdateLimiter, createPharmacyStore);

// PATCH /api/pharmacies-stores/:id - Обновить аптеку/магазин
router.patch('/:id', requireStaffAuth, requireSuperAdmin, createUpdateLimiter, updatePharmacyStore);

// DELETE /api/pharmacies-stores/:id - Удалить аптеку/магазин
router.delete('/:id', requireStaffAuth, requireSuperAdmin, createUpdateLimiter, deletePharmacyStore);

export default router;

