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

    // Отправляем информационное сообщение
    await ctx.reply('🆔 *Sizning Chat ID:*\n\nQuyidagi ID ni nusxalash uchun bosing va tanlang.', { 
      parse_mode: 'Markdown' 
    });

    // Отправляем ID отдельным сообщением для удобного копирования
    // Используем обычный текст без форматирования, чтобы ID было легко скопировать
    await ctx.reply(`${chatId}`);

    // Если User ID отличается от Chat ID, отправляем его тоже
    if (userId && userId !== chatId) {
      await ctx.reply(`User ID: ${userId}`);
    }
  } catch (error: any) {
    console.error('Error in chatIdHandler:', error);
    await ctx.reply('Xatolik yuz berdi. Keyinroq urinib ko\'ring.');
  }
}




