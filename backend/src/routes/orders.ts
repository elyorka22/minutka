// ============================================
// Orders Routes
// ============================================

import express from 'express';
import { createOrder, getOrders, getOrderById, updateOrderStatus } from '../controllers/orders';
import { requireStaffAuth } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/orders
 * Создать новый заказ
 * Публичный доступ (для клиентов)
 */
router.post('/', createOrder);

/**
 * GET /api/orders
 * Получить список заказов
 * Query params: restaurant_id (optional), status (optional)
 * Только для сотрудников
 */
router.get('/', requireStaffAuth, getOrders);

/**
 * GET /api/orders/:id
 * Получить заказ по ID
 * Только для сотрудников
 */
router.get('/:id', requireStaffAuth, getOrderById);

/**
 * PATCH /api/orders/:id/status
 * Обновить статус заказа
 * Body: { status: 'accepted' | 'ready' | 'delivered' | 'cancelled' }
 * Только для сотрудников
 */
router.patch('/:id/status', requireStaffAuth, updateOrderStatus);

export default router;


