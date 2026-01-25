// ============================================
// Cleanup Routes
// ============================================

import { Router } from 'express';
import { deleteOldArchivedOrders } from '../controllers/cleanup';

const router = Router();

// POST /api/cleanup/old-orders - Удалить архивные заказы старше 20 дней
router.post('/old-orders', deleteOldArchivedOrders);

export default router;

