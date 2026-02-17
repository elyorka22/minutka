// ============================================
// Store Carousels Routes
// ============================================

import { Router } from 'express';
import {
  getStoreCarousels,
  getStoreCarouselById,
  createStoreCarousel,
  updateStoreCarousel,
  deleteStoreCarousel,
  getStoreCarouselItems,
  addStoreCarouselItems,
  removeStoreCarouselItem,
  updateStoreCarouselItemsOrder,
} from '../controllers/storeCarousels';
import { requireStaffAuth } from '../middleware/auth';

const router = Router();

// Публичные маршруты (для чтения активных каруселей)
router.get('/', getStoreCarousels);
router.get('/:id', getStoreCarouselById);
router.get('/:id/items', getStoreCarouselItems);

// Защищенные маршруты (только для супер-админов)
router.post('/', requireStaffAuth, createStoreCarousel);
router.patch('/:id', requireStaffAuth, updateStoreCarousel);
router.delete('/:id', requireStaffAuth, deleteStoreCarousel);
router.post('/:id/items', requireStaffAuth, addStoreCarouselItems);
router.delete('/:id/items/:item_id', requireStaffAuth, removeStoreCarouselItem);
router.put('/:id/items', requireStaffAuth, updateStoreCarouselItemsOrder);

export default router;

