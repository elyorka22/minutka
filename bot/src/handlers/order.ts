// ============================================
// Order Text Handler - Обработка текста заказа
// ============================================

import { Context } from 'telegraf';
import { supabase } from '../config/supabase';

/**
 * Обработчик текстового сообщения (заказ)
 * Сохраняет текст заказа и запрашивает адрес/геолокацию
 */
export async function orderHandler(ctx: Context) {
  try {
    const session = (ctx as any).session || {};
    const restaurantId = session.selectedRestaurantId;

    // Если ресторан не выбран, игнорируем сообщение
    if (!restaurantId) {
      // Возможно, пользователь просто пишет сообщение
      return;
    }

    const orderText = (ctx.message as any)?.text;

    if (!orderText) {
      return;
    }

    // Сохраняем текст заказа в сессии
    session.orderText = orderText;
    (ctx as any).session = session;

    // Запрашиваем адрес или геолокацию
    await ctx.reply(
      `📝 *Buyurtmangiz saqlandi:*\n${orderText}\n\n` +
      `📍 *Yetkazib berish manzilini yoki geolokatsiyani yuboring:*\n` +
      `• Tugma 📎 ni bosing va "Geolokatsiya" ni tanlang\n` +
      `• Yoki shunchaki manzilni matn ko'rinishida yozing`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{ text: '📍 Geolokatsiyani yuborish', request_location: true }]
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }
    );
  } catch (error: any) {
    console.error('Error in order handler:', error);
      await ctx.reply('Xatolik yuz berdi. Qaytadan boshlang: /start');
  }
}

