// ============================================
// Menu Handler - Команда /меню для групп
// Упрощенная версия: отправляет все существующие меню
// ============================================

import { Context } from 'telegraf';
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
    const { data: menuMessages, error: menuError } = await supabase
      .from('restaurant_menu_messages')
      .select('restaurant_id, message_text, button_text, menu_url')
      .order('created_at', { ascending: false });

    if (menuError) {
      console.error('[MenuHandler] Error fetching menu messages:', menuError);
      await ctx.reply('❌ Произошла ошибка при получении меню. Попробуйте позже.');
      return;
    }

    if (!menuMessages || menuMessages.length === 0) {
      await ctx.reply('📋 Меню пока не созданы. Создайте меню через админ-панель ресторана.');
      return;
    }

    // Получаем информацию о ресторанах для фильтрации активных
    const restaurantIds = menuMessages.map(m => m.restaurant_id);
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id, name, is_active')
      .in('id', restaurantIds);

    if (restaurantsError) {
      console.error('[MenuHandler] Error fetching restaurants:', restaurantsError);
      await ctx.reply('❌ Произошла ошибка при получении информации о ресторанах.');
      return;
    }

    // Создаем мапу активных ресторанов
    const activeRestaurants = new Map<string, string>();
    restaurants?.forEach(r => {
      if (r.is_active) {
        activeRestaurants.set(r.id, r.name);
      }
    });

    // Отправляем все активные меню
    let sentCount = 0;
    for (const menuMessage of menuMessages) {
      // Пропускаем неактивные рестораны
      if (!activeRestaurants.has(menuMessage.restaurant_id)) {
        continue;
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

      try {
        // Отправляем сообщение
        await ctx.reply(menuMessage.message_text, {
          reply_markup: replyMarkup
        });
        sentCount++;
        
        // Небольшая задержка между сообщениями, чтобы не перегружать API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (sendError: any) {
        console.error(`[MenuHandler] Error sending menu for restaurant ${menuMessage.restaurant_id}:`, sendError);
        // Продолжаем отправку остальных меню даже если одно не отправилось
      }
    }

    console.log(`[MenuHandler] Sent ${sentCount} menu messages to chat ${ctx.chat?.id}`);
    
    if (sentCount === 0) {
      await ctx.reply('📋 Нет активных меню для отправки.');
    }
  } catch (error: any) {
    console.error('Error in menu handler:', error);
    await ctx.reply('❌ Произошла ошибка при отправке меню. Попробуйте позже.');
  }
}

