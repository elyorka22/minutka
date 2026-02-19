// ============================================
// Start Handler - Показывает приветствие
// ============================================

import { Context } from 'telegraf';
import { createMainMenuKeyboard } from '../keyboards/mainMenu';
import { supabase } from '../config/supabase';

/**
 * Обработчик команды /start
 * Показывает приветствие и главное меню
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
      '🛒 *Online Bozor\'ga xush kelibsiz!*\n\n' +
      'Buyurtma berish uchun veb-saytimizga kiring: https://minutka.vercel.app';

    const mainMenuKeyboard = await createMainMenuKeyboard();
    await ctx.reply(
      welcomeMessage,
      { 
        parse_mode: 'Markdown',
        ...mainMenuKeyboard
      }
    );
  } catch (error: any) {
    console.error('Error in start handler:', error);
    await ctx.reply('Xatolik yuz berdi. Keyinroq urinib ko\'ring.');
  }
}

