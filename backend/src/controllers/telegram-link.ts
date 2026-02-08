// ============================================
// Telegram Link Controller
// Отправка сообщения с кнопкой меню в Telegram бот админу ресторана
// ============================================

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { validateUuid, validateString } from '../utils/validation';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * POST /api/telegram-link/send
 * Отправить сообщение с кнопкой меню в Telegram бот админу ресторана
 * Body: { restaurant_id: string, message_text: string }
 */
export async function sendTelegramLinkMessage(req: AuthenticatedRequest, res: Response) {
  try {
    console.log('[sendTelegramLinkMessage] Request received');
    console.log('[sendTelegramLinkMessage] User:', req.user);
    console.log('[sendTelegramLinkMessage] Request body raw:', JSON.stringify(req.body));
    
    const { restaurant_id, message_text, group_username } = req.body;
    console.log('[sendTelegramLinkMessage] Request body parsed:', { restaurant_id, message_text, group_username });
    
    if (!restaurant_id) {
      console.error('[sendTelegramLinkMessage] Missing restaurant_id in request body');
      return res.status(400).json({
        success: false,
        error: 'restaurant_id is required'
      });
    }
    
    if (!message_text) {
      console.error('[sendTelegramLinkMessage] Missing message_text in request body');
      return res.status(400).json({
        success: false,
        error: 'message_text is required'
      });
    }

    // Валидация
    if (!validateUuid(restaurant_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid restaurant_id format'
      });
    }

    if (!validateString(message_text) || message_text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required'
      });
    }

    if (message_text.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message text is too long (max 1000 characters)'
      });
    }

    // Проверка прав доступа
    if (req.user?.role === 'restaurant_admin') {
      // Проверяем, что админ имеет доступ к этому ресторану
      const telegramId = BigInt(req.user.telegram_id);
      const { data: adminRecord, error: adminError } = await supabase
        .from('restaurant_admins')
        .select('restaurant_id')
        .eq('telegram_id', telegramId)
        .eq('restaurant_id', restaurant_id)
        .eq('is_active', true)
        .single();

      if (adminError || !adminRecord) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You do not have access to this restaurant'
        });
      }
    } else if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Получаем информацию о ресторане
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, menu_button_text, telegram_chat_id')
      .eq('id', restaurant_id)
      .single();

    if (restaurantError || !restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    // Получаем URL меню
    const baseUrl = process.env.FRONTEND_URL || 'https://minutka-chi.vercel.app';
    const menuUrl = `${baseUrl}/menu/${restaurant.id}`;
    const buttonText = restaurant.menu_button_text || 'Меню';

    console.log('[sendTelegramLinkMessage] Menu URL:', menuUrl);
    console.log('[sendTelegramLinkMessage] Button text:', buttonText);
    console.log('[sendTelegramLinkMessage] Message text:', message_text);

    // Сохраняем сообщение в БД для использования командой /меню (без отправки админу)
    const { error: upsertError } = await supabase
      .from('restaurant_menu_messages')
      .upsert(
        {
          restaurant_id: restaurant_id,
          message_text: message_text,
          button_text: buttonText,
          menu_url: menuUrl,
          telegram_message_id: null, // Не отправляем, поэтому null
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'restaurant_id',
          ignoreDuplicates: false
        }
      );

    if (upsertError) {
      console.error('[sendTelegramLinkMessage] Error saving message to DB:', upsertError);
      return res.status(500).json({
        success: false,
        error: 'Не удалось сохранить сообщение в базу данных',
        details: upsertError.message
      });
    }

    console.log('[sendTelegramLinkMessage] Message saved to DB for restaurant:', restaurant_id);
    
    res.json({
      success: true,
      message: 'Сообщение успешно создано! Используйте код в группе для отправки.',
      data: {
        restaurant_id: restaurant_id
      }
    });
  } catch (error: any) {
    console.error('[sendTelegramLinkMessage] Unexpected error occurred:');
    console.error('[sendTelegramLinkMessage] Error type:', typeof error);
    console.error('[sendTelegramLinkMessage] Error constructor:', error?.constructor?.name);
    console.error('[sendTelegramLinkMessage] Error message:', error?.message);
    console.error('[sendTelegramLinkMessage] Error stack:', error?.stack);
    
    // Безопасная сериализация ошибки
    let errorMessage = 'Failed to send Telegram link message';
    if (error?.message) {
      errorMessage = String(error.message);
    }
    
    // Проверяем, не был ли ответ уже отправлен
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to send Telegram link message',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      });
    } else {
      console.error('[sendTelegramLinkMessage] Response already sent, cannot send error response');
    }
  }
}

