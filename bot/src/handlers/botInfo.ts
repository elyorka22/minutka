// ============================================
// Bot Info Handler - Обработка кнопок бота
// ============================================

import { Context } from 'telegraf';
import { supabase } from '../config/supabase';
import { apiRequest } from '../config/api';

/**
 * Обработчик кнопки "Bot haqida"
 */
export async function botInfoHandler(ctx: Context) {
  try {
    // Получаем текст из БД
    const { data, error } = await supabase
      .from('bot_settings')
      .select('value')
      .eq('key', 'bot_info')
      .single();

    if (error || !data) {
      await ctx.reply('Bot haqida ma\'lumot topilmadi.');
      return;
    }

    await ctx.reply(data.value, { parse_mode: 'Markdown' });
  } catch (error: any) {
    console.error('Error in botInfoHandler:', error);
    await ctx.reply('Xatolik yuz berdi. Keyinroq urinib ko\'ring.');
  }
}

/**
 * Обработчик кнопки "Hamkorlik"
 */
export async function partnershipHandler(ctx: Context) {
  try {
    // Получаем текст из БД
    const { data, error } = await supabase
      .from('bot_settings')
      .select('value')
      .eq('key', 'partnership')
      .single();

    if (error || !data) {
      await ctx.reply('Hamkorlik haqida ma\'lumot topilmadi.');
      return;
    }

    await ctx.reply(data.value, { parse_mode: 'Markdown' });
  } catch (error: any) {
    console.error('Error in partnershipHandler:', error);
    await ctx.reply('Xatolik yuz berdi. Keyinroq urinib ko\'ring.');
  }
}

/**
 * Обработчик кнопки "Chat ID"
 */
export async function chatIdHandler(ctx: Context) {
  try {
    const chatId = ctx.chat?.id;
    const userId = ctx.from?.id;
    
    if (!chatId) {
      await ctx.reply('Chat ID topilmadi.');
      return;
    }

    let message = `🆔 *Sizning Chat ID:*\n\n`;
    message += `Chat ID: \`${chatId}\`\n`;
    
    if (userId) {
      message += `User ID: \`${userId}\``;
    }

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error: any) {
    console.error('Error in chatIdHandler:', error);
    await ctx.reply('Xatolik yuz berdi. Keyinroq urinib ko\'ring.');
  }
}




