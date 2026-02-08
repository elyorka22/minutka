// ============================================
// Menu Handler - Команда /меню для групп
// Упрощенная версия: отправляет все существующие меню
// ============================================

import { Context, Markup } from 'telegraf';
import { supabase } from '../config/supabase';

/**
 * Обработчик команды /меню
 * Отправляет все существующие меню из базы данных
 * Админ удалит ненужные, оставит только свое
 */
export async function menuHandler(ctx: Context) {
  try {
    console.log('[MenuHandler] Command /меню received');
    console.log('[MenuHandler] Chat type:', ctx.chat?.type);
    console.log('[MenuHandler] Chat ID:', ctx.chat?.id);
    
    // Получаем все сохраненные меню из БД
    console.log('[MenuHandler] Fetching menu messages from database...');
    const { data: menuMessages, error: menuError } = await supabase
      .from('restaurant_menu_messages')
      .select('restaurant_id, message_text, button_text, menu_url')
      .order('created_at', { ascending: false });

    if (menuError) {
      console.error('[MenuHandler] Error fetching menu messages:', menuError);
      console.error('[MenuHandler] Error code:', menuError.code);
      console.error('[MenuHandler] Error message:', menuError.message);
      console.error('[MenuHandler] Error details:', menuError.details);
      console.error('[MenuHandler] Error hint:', menuError.hint);
      await ctx.reply('❌ Произошла ошибка при получении меню. Попробуйте позже.');
      return;
    }

    console.log('[MenuHandler] Query result - menuMessages:', menuMessages);
    console.log('[MenuHandler] Found menu messages count:', menuMessages?.length || 0);
    if (menuMessages && menuMessages.length > 0) {
      console.log('[MenuHandler] Menu messages restaurant IDs:', menuMessages.map(m => m.restaurant_id));
      console.log('[MenuHandler] First menu message:', JSON.stringify(menuMessages[0], null, 2));
    }

    if (!menuMessages || menuMessages.length === 0) {
      console.log('[MenuHandler] No menu messages found in database');
      await ctx.reply('📋 Меню пока не созданы. Создайте меню через админ-панель ресторана.');
      return;
    }

    // Убираем проверку ресторанов - отправляем все меню напрямую
    // Админ сам удалит ненужные
    let sentCount = 0;
    for (const menuMessage of menuMessages) {
      console.log(`[MenuHandler] Processing menu for restaurant ${menuMessage.restaurant_id}`);

      try {
        console.log(`[MenuHandler] Sending menu message:`, {
          text: menuMessage.message_text,
          button_text: menuMessage.button_text,
          menu_url: menuMessage.menu_url
        });
        
        // Проверяем, что URL валидный HTTPS
        if (!menuMessage.menu_url.startsWith('https://')) {
          console.error(`[MenuHandler] Invalid URL format (must be HTTPS): ${menuMessage.menu_url}`);
          throw new Error(`Invalid URL format: ${menuMessage.menu_url}`);
        }
        
        // Формируем кнопку для Telegram Web App согласно Telegram Bot API
        // Используем прямой формат объекта, как требует Telegram Bot API
        const webAppButton = {
          text: menuMessage.button_text || 'Меню',
          web_app: {
            url: menuMessage.menu_url
          }
        };
        
        const replyMarkup = {
          inline_keyboard: [
            [webAppButton]
          ]
        };
        
        console.log(`[MenuHandler] Reply markup format:`, JSON.stringify(replyMarkup, null, 2));
        console.log(`[MenuHandler] Button text: "${menuMessage.button_text}"`);
        console.log(`[MenuHandler] Menu URL: "${menuMessage.menu_url}"`);
        console.log(`[MenuHandler] Web App button object:`, JSON.stringify(webAppButton, null, 2));
        
        // Отправляем сообщение через ctx.telegram.sendMessage напрямую
        // Это обходит проверку типов Telegraf и использует прямой формат Telegram Bot API
        const result = await ctx.telegram.sendMessage(
          ctx.chat!.id,
          menuMessage.message_text,
          {
            reply_markup: replyMarkup
          }
        );
        
        console.log(`[MenuHandler] Telegram API response:`, result);
        sentCount++;
        console.log(`[MenuHandler] Successfully sent menu ${sentCount} for restaurant ${menuMessage.restaurant_id}`);
        
        // Небольшая задержка между сообщениями, чтобы не перегружать API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (sendError: any) {
        console.error(`[MenuHandler] Error sending menu for restaurant ${menuMessage.restaurant_id}:`, sendError);
        console.error(`[MenuHandler] Send error details:`, {
          message: sendError.message,
          code: sendError.code,
          response: sendError.response
        });
        // Продолжаем отправку остальных меню даже если одно не отправилось
      }
    }

    console.log(`[MenuHandler] Total sent: ${sentCount} out of ${menuMessages.length} menu messages to chat ${ctx.chat?.id}`);
    
    if (sentCount === 0) {
      console.log('[MenuHandler] No menus were sent. Possible reasons:');
      console.log('[MenuHandler] - All restaurants not found in DB');
      console.log('[MenuHandler] - All send attempts failed');
      await ctx.reply('📋 Нет активных меню для отправки.');
    } else {
      console.log(`[MenuHandler] Successfully sent ${sentCount} menu message(s)`);
    }
  } catch (error: any) {
    console.error('Error in menu handler:', error);
    await ctx.reply('❌ Произошла ошибка при отправке меню. Попробуйте позже.');
  }
}

