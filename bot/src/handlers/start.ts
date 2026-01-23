// ============================================
// Start Handler - Показывает список ресторанов
// ============================================

import { Context } from 'telegraf';
import { apiRequest } from '../config/api';
import { Restaurant } from '../types';
import { createRestaurantKeyboard } from '../keyboards/restaurants';
import { createMainMenuKeyboard } from '../keyboards/mainMenu';
import { supabase } from '../config/supabase';

/**
 * Обработчик команды /start
 * Показывает приветствие и список ресторанов
 */
export async function startHandler(ctx: Context) {
  try {
    // Получаем welcome сообщение из БД
    const { data: welcomeSetting } = await supabase
      .from('bot_settings')
      .select('value')
      .eq('key', 'welcome_message')
      .single();

    const welcomeMessage = welcomeSetting?.value || 
      '🍽️ *Kafeshka\'ga xush kelibsiz!*\n\n' +
      'Buyurtma berish uchun restoran tanlang:';

    const mainMenuKeyboard = await createMainMenuKeyboard();
    await ctx.reply(
      welcomeMessage,
      { 
        parse_mode: 'Markdown',
        ...mainMenuKeyboard
      }
    );

    // Получаем список ресторанов из API
    const restaurants = await apiRequest<Restaurant[]>('/api/restaurants');

    if (!restaurants || restaurants.length === 0) {
      await ctx.reply('Afsuski, hozircha mavjud restoranlar yo\'q.');
      return;
    }

    // Создаем клавиатуру с ресторанами
    const keyboard = createRestaurantKeyboard(restaurants);

    await ctx.reply(
      '📋 *Mavjud restoranlar:*\n\n' +
      restaurants.map((r, i) => `${i + 1}. ${r.name}`).join('\n'),
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    );
  } catch (error: any) {
    console.error('Error in start handler:', error);
      await ctx.reply('Restoranlarni yuklashda xatolik yuz berdi. Keyinroq urinib ko\'ring.');
  }
}

