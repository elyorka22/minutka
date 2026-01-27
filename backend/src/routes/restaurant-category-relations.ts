// ============================================
// Restaurant-Category Relations Routes
// ============================================

import { Router } from 'express';
import {
  getRestaurantCategoryRelations,
  createRestaurantCategoryRelation,
  deleteRestaurantCategoryRelation,
  deleteRestaurantCategoryRelationByIds,
} from '../controllers/restaurant-category-relations';
import { requireStaffAuth, requireSuperAdmin } from '../middleware/auth';
import { createUpdateLimiter } from '../middleware/rateLimit';

const router = Router();

// GET /api/restaurant-category-relations - Получить все связи
router.get('/', getRestaurantCategoryRelations);

// POST /api/restaurant-category-relations - Создать связь
router.post('/', requireStaffAuth, requireSuperAdmin, createUpdateLimiter, createRestaurantCategoryRelation);

// DELETE /api/restaurant-category-relations/:id - Удалить связь по ID
router.delete('/:id', requireStaffAuth, requireSuperAdmin, createUpdateLimiter, deleteRestaurantCategoryRelation);

// DELETE /api/restaurant-category-relations - Удалить связь по restaurant_id и category_id
router.delete('/', requireStaffAuth, requireSuperAdmin, createUpdateLimiter, deleteRestaurantCategoryRelationByIds);

export default router;

