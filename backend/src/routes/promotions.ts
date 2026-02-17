import { Router } from 'express';
import { requireStaffAuth } from '../middleware/auth';
import {
  getPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getPromotionItems,
  addPromotionItems,
  removePromotionItem,
} from '../controllers/promotions';

const router = Router();

// Все маршруты требуют аутентификации
router.use(requireStaffAuth);

// Маршруты для акций
router.get('/', getPromotions);
router.get('/:id', getPromotionById);
router.post('/', createPromotion);
router.put('/:id', updatePromotion);
router.delete('/:id', deletePromotion);

// Маршруты для товаров в акциях
router.get('/:id/items', getPromotionItems);
router.post('/:id/items', addPromotionItems);
router.delete('/:id/items/:itemId', removePromotionItem);

export default router;

