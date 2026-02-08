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
    const { restaurant_id, message_text, group_username } = req.body;
    console.log('[sendTelegramLinkMessage] Request body:', { restaurant_id, message_text, group_username });

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

    console.log('[sendTelegramLinkMessage] Restaurant telegram_chat_id:', restaurant.telegram_chat_id);

    // Определяем, куда отправлять сообщение
    // Приоритет: group_username из запроса > telegram_chat_id группы ресторана > telegram_id админа
    let targetChatId: number | string | null = null;
    let sendToGroup = false;

    // Если передан username группы в запросе, используем его
    if (group_username && typeof group_username === 'string' && group_username.startsWith('@')) {
      targetChatId = group_username;
      sendToGroup = true;
      console.log('[sendTelegramLinkMessage] Sending to restaurant group (username from request):', targetChatId);
    } else if (restaurant.telegram_chat_id) {
      // Если у ресторана есть telegram_chat_id (группа), отправляем туда
      targetChatId = Number(restaurant.telegram_chat_id);
      sendToGroup = true;
      console.log('[sendTelegramLinkMessage] Sending to restaurant group (telegram_chat_id):', targetChatId);
    } else {
      // Иначе отправляем админу
      let adminTelegramId: bigint | null = null;

      if (req.user?.role === 'restaurant_admin') {
        // Используем telegram_id текущего админа
        adminTelegramId = BigInt(req.user.telegram_id);
        console.log('[sendTelegramLinkMessage] Using current admin telegram_id:', adminTelegramId.toString());
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
          console.error('[sendTelegramLinkMessage] Admin not found:', adminError);
          return res.status(404).json({
            success: false,
            error: 'Restaurant admin not found'
          });
        }

        adminTelegramId = BigInt(adminRecord.telegram_id);
        console.log('[sendTelegramLinkMessage] Found admin telegram_id:', adminTelegramId.toString());
      }

      if (!adminTelegramId) {
        console.error('[sendTelegramLinkMessage] Admin telegram_id is null');
        return res.status(404).json({
          success: false,
          error: 'Restaurant admin telegram_id not found'
        });
      }

      targetChatId = Number(adminTelegramId);
      console.log('[sendTelegramLinkMessage] Sending to admin (telegram_id):', targetChatId);
    }

    // Получаем URL меню
    const baseUrl = process.env.FRONTEND_URL || 'https://minutka-chi.vercel.app';
    const menuUrl = `${baseUrl}/menu/${restaurant.id}`;
    const buttonText = restaurant.menu_button_text || 'Меню';

    console.log('[sendTelegramLinkMessage] Menu URL:', menuUrl);
    console.log('[sendTelegramLinkMessage] Button text:', buttonText);
    console.log('[sendTelegramLinkMessage] Message text:', message_text);

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

    console.log('[sendTelegramLinkMessage] Reply markup:', JSON.stringify(replyMarkup, null, 2));

    // Отправляем сообщение в Telegram бот
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('[sendTelegramLinkMessage] Telegram bot token is not configured');
      return res.status(500).json({
        success: false,
        error: 'Telegram bot token is not configured'
      });
    }

    if (!targetChatId) {
      console.error('[sendTelegramLinkMessage] targetChatId is null or undefined');
      return res.status(500).json({
        success: false,
        error: 'Failed to determine target chat ID'
      });
    }

    console.log('[sendTelegramLinkMessage] Sending message to chat_id:', targetChatId);
    console.log('[sendTelegramLinkMessage] Telegram API URL:', TELEGRAM_API_URL);

    // Telegram Bot API поддерживает chat_id как число или username группы (начинающийся с @)
    let chatIdForApi: number | string;
    if (typeof targetChatId === 'string' && targetChatId.startsWith('@')) {
      chatIdForApi = targetChatId;
    } else if (typeof targetChatId === 'number') {
      chatIdForApi = targetChatId;
    } else {
      chatIdForApi = Number(targetChatId);
    }

    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatIdForApi,
        text: message_text,
        reply_markup: replyMarkup,
      }),
    });

    console.log('[sendTelegramLinkMessage] Telegram API response status:', response.status);

    if (!response.ok) {
      let errorData: any = {};
      let errorText = '';
      try {
        errorText = await response.text();
        if (errorText) {
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            // Если не JSON, используем текст как описание
            errorData = { description: errorText };
          }
        }
      } catch (e) {
        console.error('[sendTelegramLinkMessage] Error reading error response:', e);
        errorData = { description: 'Failed to read error response' };
      }
      console.error('[sendTelegramLinkMessage] Telegram API error:', errorData);
      console.error('[sendTelegramLinkMessage] Full error response:', errorText);
      return res.status(500).json({
        success: false,
        error: 'Failed to send message to Telegram',
        details: errorData.description || errorData.error_description || errorText || 'Unknown error'
      });
    }

    const data = await response.json() as { ok: boolean; result?: { message_id: number }; description?: string };
    console.log('[sendTelegramLinkMessage] Telegram API success response:', JSON.stringify(data, null, 2));
    
    const successMessage = sendToGroup 
      ? 'Сообщение успешно отправлено в группу ресторана! Кнопка будет работать в группе.'
      : 'Сообщение успешно отправлено админу! Для работы в группе добавьте telegram_chat_id группы в настройках ресторана.';
    
    res.json({
      success: true,
      message: successMessage,
      data: {
        message_id: data.result?.message_id,
        sent_to_group: sendToGroup
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

