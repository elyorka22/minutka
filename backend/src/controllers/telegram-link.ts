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
    const { restaurant_id, message_text } = req.body;

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
      .select('id, name, menu_button_text')
      .eq('id', restaurant_id)
      .single();

    if (restaurantError || !restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found'
      });
    }

    // Получаем telegram_id админа ресторана
    let adminTelegramId: bigint | null = null;

    if (req.user?.role === 'restaurant_admin') {
      // Используем telegram_id текущего админа
      adminTelegramId = BigInt(req.user.telegram_id);
    } else {
      // Для super_admin - получаем первого активного админа ресторана
      const { data: adminRecord, error: adminError } = await supabase
        .from('restaurant_admins')
        .select('telegram_id')
        .eq('restaurant_id', restaurant_id)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (adminError || !adminRecord) {
        return res.status(404).json({
          success: false,
          error: 'Restaurant admin not found'
        });
      }

      adminTelegramId = BigInt(adminRecord.telegram_id);
    }

    // Получаем URL меню
    const baseUrl = process.env.FRONTEND_URL || 'https://minutka-chi.vercel.app';
    const menuUrl = `${baseUrl}/menu/${restaurant.id}`;
    const buttonText = restaurant.menu_button_text || 'Меню';

    // Формируем кнопку для Telegram Web App
    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: buttonText,
            web_app: {
              url: menuUrl
            }
          }
        ]
      ]
    };

    // Отправляем сообщение в Telegram бот
    if (!TELEGRAM_BOT_TOKEN) {
      return res.status(500).json({
        success: false,
        error: 'Telegram bot token is not configured'
      });
    }

    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: Number(adminTelegramId),
        text: message_text,
        reply_markup: replyMarkup,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { description?: string };
      console.error('Telegram API error:', errorData);
      return res.status(500).json({
        success: false,
        error: 'Failed to send message to Telegram',
        details: errorData.description || 'Unknown error'
      });
    }

    const data = await response.json() as { ok: boolean; result?: { message_id: number }; description?: string };
    
    res.json({
      success: true,
      message: 'Message sent successfully to Telegram',
      data: {
        message_id: data.result?.message_id
      }
    });
  } catch (error: any) {
    console.error('Error in sendTelegramLinkMessage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send Telegram link message',
      message: error.message
    });
  }
}

