// ============================================
// Restaurant Selection Handler
// ============================================

import { Context } from 'telegraf';
import { apiRequest } from '../config/api';
import { Restaurant } from '../../shared/types';
import { supabase } from '../config/supabase';

/**
 * Обработчик выбора ресторана
 * Сохраняет выбор пользователя и запрашивает заказ
 */
export async function restaurantHandler(ctx: Context, restaurantId: string) {
  try {
    // Получаем информацию о ресторане
    const restaurant = await apiRequest<Restaurant>(`/api/restaurants/${restaurantId}`);

    if (!restaurant) {
      await ctx.answerCbQuery('Restoran topilmadi');
      return;
    }

    // Сохраняем выбор ресторана в сессии пользователя
    // В реальном приложении можно использовать Redis или БД для сессий
    // Здесь используем простой подход через контекст
    (ctx as any).session = {
      ...((ctx as any).session || {}),
      selectedRestaurantId: restaurantId,
      selectedRestaurantName: restaurant.name
    };

    await ctx.answerCbQuery(`Tanlandi: ${restaurant.name}`);

    // Запрашиваем заказ
    await ctx.reply(
      `✅ *Tanlangan restoran: ${restaurant.name}*\n\n` +
      `📝 *Buyurtmangizni erkin shaklda yozing:*\n` +
      `Masalan: "Pitsa Margarita, 2 porsiya, kola 0.5l"`,
      { parse_mode: 'Markdown' }
    );
  } catch (error: any) {
    console.error('Error in restaurant handler:', error);
      await ctx.answerCbQuery('Restoran tanlashda xatolik');
      await ctx.reply('Xatolik yuz berdi. Restoranni qayta tanlang: /start');
  }
}

