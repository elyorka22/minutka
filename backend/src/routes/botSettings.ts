// ============================================
// Bot Settings Routes
// ============================================

import { Router } from 'express';
import { getBotSettings, updateBotSetting } from '../controllers/botSettings';

const router = Router();

// GET /api/bot-settings - Получить все настройки бота
router.get('/', getBotSettings);

// PATCH /api/bot-settings/:key - Обновить настройку
router.patch('/:key', updateBotSetting);

export default router;



