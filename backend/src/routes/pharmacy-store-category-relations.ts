// ============================================
// Pharmacy/Store-Category Relations Routes
// ============================================

import { Router } from 'express';
import {
  getPharmacyStoreCategoryRelations,
  createPharmacyStoreCategoryRelation,
  deletePharmacyStoreCategoryRelation,
  deletePharmacyStoreCategoryRelationByIds,
} from '../controllers/pharmacy-store-category-relations';
import { requireStaffAuth, requireSuperAdmin } from '../middleware/auth';
import { createUpdateLimiter } from '../middleware/rateLimit';

const router = Router();

// GET /api/pharmacy-store-category-relations - Получить все связи
router.get('/', getPharmacyStoreCategoryRelations);

// POST /api/pharmacy-store-category-relations - Создать связь
router.post('/', requireStaffAuth, requireSuperAdmin, createUpdateLimiter, createPharmacyStoreCategoryRelation);

// DELETE /api/pharmacy-store-category-relations/:id - Удалить связь по ID
router.delete('/:id', requireStaffAuth, requireSuperAdmin, createUpdateLimiter, deletePharmacyStoreCategoryRelation);

// DELETE /api/pharmacy-store-category-relations - Удалить связь по pharmacy_store_id и category_id
router.delete('/', requireStaffAuth, requireSuperAdmin, createUpdateLimiter, deletePharmacyStoreCategoryRelationByIds);

export default router;

