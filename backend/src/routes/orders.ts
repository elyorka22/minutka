// ============================================
// Orders Routes
// ============================================

import express from 'express';
import { createOrder, getOrders, getOrderById, updateOrderStatus } from '../controllers/orders';

const router = express.Router();

/**
 * POST /api/orders
 * Создать новый заказ
 */
router.post('/', createOrder);

/**
 * GET /api/orders
 * Получить список заказов
 * Query params: restaurant_id (optional), status (optional)
 */
router.get('/', getOrders);

/**
 * GET /api/orders/:id
 * Получить заказ по ID
 */
router.get('/:id', getOrderById);

/**
 * PATCH /api/orders/:id/status
 * Обновить статус заказа
 * Body: { status: 'accepted' | 'ready' | 'delivered' | 'cancelled' }
 */
router.patch('/:id/status', updateOrderStatus);

export default router;


