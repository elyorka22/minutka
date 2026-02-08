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

    console.log('[sendTelegramLinkMessage] Restaurant telegram_chat_id:', restaurant.telegram_chat_id);

    // Всегда отправляем админу (сообщение сохраняется в БД для использования командой /меню)
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

    const targetChatId = Number(adminTelegramId);
    const sendToGroup = false; // Всегда отправляем админу
    console.log('[sendTelegramLinkMessage] Sending to admin (telegram_id):', targetChatId);

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
    } else if (targetChatId === null || targetChatId === undefined) {
      console.error('[sendTelegramLinkMessage] targetChatId is null or undefined');
      return res.status(500).json({
        success: false,
        error: 'Failed to determine target chat ID',
        message: 'Target chat ID is null or undefined'
      });
    } else {
      // Пытаемся преобразовать в число
      const parsed = Number(targetChatId);
      if (isNaN(parsed)) {
        console.error('[sendTelegramLinkMessage] Invalid targetChatId format:', targetChatId);
        return res.status(400).json({
          success: false,
          error: 'Invalid chat ID format',
          message: `Chat ID must be a number or username starting with @, got: ${targetChatId}`
        });
      }
      chatIdForApi = parsed;
    }
    
    console.log('[sendTelegramLinkMessage] Final chat_id for API:', chatIdForApi);

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

    // Читаем ответ один раз
    const responseText = await response.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('[sendTelegramLinkMessage] Failed to parse response as JSON:', e);
      console.error('[sendTelegramLinkMessage] Response text:', responseText);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse Telegram API response',
        details: responseText || 'Unknown error'
      });
    }

    if (!response.ok || !data.ok) {
      console.error('[sendTelegramLinkMessage] Telegram API error response:');
      console.error('[sendTelegramLinkMessage] Status:', response.status);
      console.error('[sendTelegramLinkMessage] Response text:', responseText);
      console.error('[sendTelegramLinkMessage] Parsed data:', JSON.stringify(data, null, 2));
      
      const errorDescription = data.description || data.error_description || responseText || 'Unknown error';
      console.error('[sendTelegramLinkMessage] Error description:', errorDescription);
      
      // Более понятные сообщения об ошибках
      let userFriendlyError = 'Не удалось отправить сообщение в Telegram';
      if (errorDescription.includes('chat not found') || errorDescription.includes('Chat not found')) {
        userFriendlyError = 'Группа не найдена. Убедитесь, что бот добавлен в группу и группа имеет публичный username.';
      } else if (errorDescription.includes('bot was blocked') || errorDescription.includes('bot is not a member')) {
        userFriendlyError = 'Бот не является участником группы. Добавьте бота в группу как администратора.';
      } else if (errorDescription.includes('not enough rights')) {
        userFriendlyError = 'У бота недостаточно прав для отправки сообщений в группу.';
      } else if (errorDescription.includes('chat_id is empty')) {
        userFriendlyError = 'Неверный формат chat_id или username группы.';
      }
      
      return res.status(500).json({
        success: false,
        error: userFriendlyError,
        details: errorDescription
      });
    }
    console.log('[sendTelegramLinkMessage] Telegram API success response:', JSON.stringify(data, null, 2));
    
    // Сохраняем сообщение в БД для использования командой /меню
    try {
      const { error: upsertError } = await supabase
        .from('restaurant_menu_messages')
        .upsert(
          {
            restaurant_id: restaurant_id,
            message_text: message_text,
            button_text: buttonText,
            menu_url: menuUrl,
            telegram_message_id: data.result?.message_id || null,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'restaurant_id',
            ignoreDuplicates: false
          }
        );

      if (upsertError) {
        console.error('[sendTelegramLinkMessage] Error saving message to DB:', upsertError);
        // Не прерываем выполнение, так как сообщение уже отправлено
      } else {
        console.log('[sendTelegramLinkMessage] Message saved to DB for restaurant:', restaurant_id);
      }
    } catch (dbError: any) {
      console.error('[sendTelegramLinkMessage] Error saving message to DB (catch):', dbError);
      // Не прерываем выполнение, так как сообщение уже отправлено
    }
    
    const successMessage = 'Сообщение успешно сохранено! Теперь используйте команду /меню в группе для отправки.';
    
    res.json({
      success: true,
      message: successMessage,
      data: {
        message_id: data.result?.message_id,
        sent_to_group: sendToGroup
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

