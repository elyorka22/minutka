// ============================================
// Bot Settings Routes
// ============================================

import { Router } from 'express';
import { getBotSettings, updateBotSetting } from '../controllers/botSettings';
import { requireSuperAdmin } from '../middleware/auth';

const router = Router();

// GET /api/bot-settings - Получить все настройки бота (публичный доступ)
router.get('/', getBotSettings);

// PATCH /api/bot-settings/:key - Обновить настройку (только для супер-админа)
router.patch('/:key', requireSuperAdmin, updateBotSetting);

export default router;



