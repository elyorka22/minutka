// ============================================
// Menu Handler - Команда /меню для групп
// ============================================

import { Context } from 'telegraf';
import { supabase } from '../config/supabase';

/**
 * Обработчик команды /меню
 * Позволяет отправить сохраненное сообщение с кнопкой меню в группу
 * Использование: /меню <restaurant_id>
 */
export async function menuHandler(ctx: Context) {
  try {
    console.log('[MenuHandler] Command /меню received');
    console.log('[MenuHandler] Chat type:', ctx.chat?.type);
    console.log('[MenuHandler] Chat ID:', ctx.chat?.id);
    console.log('[MenuHandler] User ID:', ctx.from?.id);
    
    // Проверяем, что команда вызвана в группе
    const chatType = ctx.chat?.type;
    if (chatType !== 'group' && chatType !== 'supergroup') {
      await ctx.reply(
        '⚠️ Эта команда работает только в группах.\n\n' +
        'Использование: /меню <restaurant_id>\n' +
        'Пример: /меню 6e6196b7-1823-4dcb-8c9e-0a519a670326'
      );
      return;
    }

    const messageText = (ctx.message as any)?.text || '';
    const parts = messageText.split(' ');
    
    // Если указан restaurant_id
    if (parts.length >= 2) {
      const restaurantId = parts[1].trim();
      
      // Валидация UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(restaurantId)) {
        await ctx.reply(
          '❌ Неверный формат ID ресторана.\n\n' +
          'Использование: /меню <restaurant_id>\n' +
          'Пример: /меню 6e6196b7-1823-4dcb-8c9e-0a519a670326'
        );
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
          '2. Сообщение было создано через админ-панель ресторана'
        );
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
        return;
      }

      if (!restaurant.is_active) {
        await ctx.reply('❌ Этот ресторан временно недоступен.');
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

      console.log(`[MenuHandler] Menu message sent to group ${ctx.chat?.id} for restaurant ${restaurantId}`);
    } else {
      // Если ID не указан, показываем инструкцию
      await ctx.reply(
        '📋 *Команда /меню*\n\n' +
        'Отправляет сообщение с кнопкой меню ресторана в группу.\n\n' +
        '*Использование:*\n' +
        '`/меню <restaurant_id>`\n\n' +
        '*Пример:*\n' +
        '`/меню 6e6196b7-1823-4dcb-8c9e-0a519a670326`\n\n' +
        '💡 *Где найти restaurant_id?*\n' +
        'ID ресторана можно найти в админ-панели ресторана или у администратора.',
        {
          parse_mode: 'Markdown'
        }
      );
    }
  } catch (error: any) {
    console.error('Error in menu handler:', error);
    await ctx.reply('❌ Произошла ошибка при отправке меню. Попробуйте позже.');
  }
}

