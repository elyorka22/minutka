// ============================================
// Telegram Link Routes
// ============================================

import express from 'express';
import { sendTelegramLinkMessage } from '../controllers/telegram-link';
import { requireStaffAuth } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/telegram-link/send
 * Отправить сообщение с кнопкой меню в Telegram бот админу ресторана
 */
router.post('/send', requireStaffAuth, sendTelegramLinkMessage);

export default router;

