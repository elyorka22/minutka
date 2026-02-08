// ============================================
// Menu Handler - Команда /меню для групп
// ============================================

import { Context } from 'telegraf';
import { supabase } from '../config/supabase';

// Простое хранилище сессий для ожидания ID ресторана
const menuSessions = new Map<number, { chatId: number; timestamp: number }>();

// Очистка старых сессий (старше 5 минут)
setInterval(() => {
  const now = Date.now();
  for (const [userId, session] of menuSessions.entries()) {
    if (now - session.timestamp > 5 * 60 * 1000) {
      menuSessions.delete(userId);
    }
  }
}, 60000); // Проверяем каждую минуту

/**
 * Обработчик команды /меню
 * Интерактивный диалог: бот просит ID ресторана, затем отправляет сообщение
 */
export async function menuHandler(ctx: Context) {
  try {
    console.log('[MenuHandler] Command /меню received');
    console.log('[MenuHandler] Chat type:', ctx.chat?.type);
    console.log('[MenuHandler] Chat ID:', ctx.chat?.id);
    console.log('[MenuHandler] User ID:', ctx.from?.id);
    
    const chatType = ctx.chat?.type;
    const userId = ctx.from?.id;
    const chatId = ctx.chat?.id;
    
    if (!userId || !chatId) {
      await ctx.reply('❌ Не удалось определить пользователя или чат.');
      return;
    }

    // Проверяем, что команда вызвана в группе
    if (chatType !== 'group' && chatType !== 'supergroup') {
      await ctx.reply(
        '⚠️ Эта команда работает только в группах.\n\n' +
        'Добавьте бота в группу и используйте команду /меню там.'
      );
      return;
    }

    const messageText = (ctx.message as any)?.text || '';
    const parts = messageText.split(' ');

    // Если это команда /меню без параметров
    if (parts.length === 1 || (parts.length === 2 && parts[1].trim() === '')) {
      // Создаем сессию ожидания ID ресторана
      menuSessions.set(userId, {
        chatId: chatId,
        timestamp: Date.now()
      });

      await ctx.reply(
        '📋 *Отправка меню в группу*\n\n' +
        'Пожалуйста, введите ID ресторана:\n\n' +
        '💡 *Где найти ID ресторана?*\n' +
        'ID можно найти в админ-панели ресторана на странице "Ссылка для Telegram".\n\n' +
        'Пример формата:\n' +
        '`6e6196b7-1823-4dcb-8c9e-0a519a670326`',
        {
          parse_mode: 'Markdown'
        }
      );
      return;
    }

    // Если ID указан в команде (старый формат для обратной совместимости)
    if (parts.length >= 2) {
      const restaurantId = parts[1].trim();
      await processRestaurantId(ctx, restaurantId, chatId);
      return;
    }
  } catch (error: any) {
    console.error('Error in menu handler:', error);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
  }
}

/**
 * Обработка введенного ID ресторана
 */
export async function processRestaurantId(ctx: Context, restaurantId: string, chatId: number) {
  try {
    const userId = ctx.from?.id;
    
    // Валидация UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(restaurantId)) {
      await ctx.reply(
        '❌ Неверный формат ID ресторана.\n\n' +
        'ID должен быть в формате UUID.\n' +
        'Пример: `6e6196b7-1823-4dcb-8c9e-0a519a670326`\n\n' +
        'Попробуйте снова: /меню',
        {
          parse_mode: 'Markdown'
        }
      );
      if (userId) menuSessions.delete(userId);
      return;
    }

    // Получаем сохраненное сообщение из БД
    const { data: menuMessage, error: menuError } = await supabase
      .from('restaurant_menu_messages')
      .select('message_text, button_text, menu_url')
      .eq('restaurant_id', restaurantId)
      .single();

    if (menuError || !menuMessage) {
      await ctx.reply(
        '❌ Сообщение с меню для этого ресторана не найдено.\n\n' +
        'Убедитесь, что:\n' +
        '1. ID ресторана указан правильно\n' +
        '2. Сообщение было создано через админ-панель ресторана (кнопка "Сохранить")'
      );
      if (userId) menuSessions.delete(userId);
      return;
    }

    // Получаем информацию о ресторане для проверки
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, is_active')
      .eq('id', restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      await ctx.reply('❌ Ресторан не найден.');
      if (userId) menuSessions.delete(userId);
      return;
    }

    if (!restaurant.is_active) {
      await ctx.reply('❌ Этот ресторан временно недоступен.');
      if (userId) menuSessions.delete(userId);
      return;
    }

    // Формируем кнопку для Telegram Web App
    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: menuMessage.button_text,
            web_app: {
              url: menuMessage.menu_url
            }
          }
        ]
      ]
    };

    // Отправляем сообщение в группу
    await ctx.reply(menuMessage.message_text, {
      reply_markup: replyMarkup
    });

    // Удаляем сессию
    if (userId) menuSessions.delete(userId);

    console.log(`[MenuHandler] Menu message sent to group ${chatId} for restaurant ${restaurantId}`);
  } catch (error: any) {
    console.error('Error processing restaurant ID:', error);
    await ctx.reply('❌ Произошла ошибка при отправке меню. Попробуйте позже.');
    const userId = ctx.from?.id;
    if (userId) menuSessions.delete(userId);
  }
}

/**
 * Проверка, ожидает ли пользователь ввода ID ресторана
 */
export function isWaitingForRestaurantId(userId: number): boolean {
  return menuSessions.has(userId);
}

/**
 * Получить chat ID из сессии
 */
export function getMenuSessionChatId(userId: number): number | null {
  const session = menuSessions.get(userId);
  return session ? session.chatId : null;
}

