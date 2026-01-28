// ============================================
// Location Handler - Обработка геолокации/адреса
// ============================================

import { Context } from 'telegraf';
import { apiRequest } from '../config/api';
import { supabase } from '../config/supabase';
import { sendOrderToRestaurant } from '../services/restaurantNotification';
import { notifyRestaurantAdminsAboutNewOrder } from '../services/adminNotification';

/**
 * Обработчик геолокации или текстового адреса
 * Создает заказ и отправляет его ресторану
 */
export async function locationHandler(ctx: Context) {
  try {
    const session = (ctx as any).session || {};
    const restaurantId = session.selectedRestaurantId;
    const orderText = session.orderText;

    if (!restaurantId || !orderText) {
      await ctx.reply('Avval restoranni tanlang va buyurtmangizni yozing. Qaytadan boshlang: /start');
      return;
    }

    const userId = ctx.from?.id;
    if (!userId) {
      await ctx.reply('Foydalanuvchini aniqlab bo\'lmadi');
      return;
    }

    // Получаем или создаем пользователя в БД
    let user = await getUserByTelegramId(userId);
    if (!user) {
      user = await createUser(ctx.from);
    }

    // Получаем геолокацию или адрес
    const location = (ctx.message as any)?.location;
    let latitude: number | null = null;
    let longitude: number | null = null;
    let address: string | null = null;

    if (location) {
      latitude = location.latitude;
      longitude = location.longitude;
      address = `Geolokatsiya: ${latitude}, ${longitude}`;
    } else {
      // Если это текстовый адрес
      const text = (ctx.message as any)?.text;
      if (text) {
        address = text;
      }
    }

    if (!address && !latitude) {
      await ctx.reply('Iltimos, geolokatsiyani yoki manzilni matn ko\'rinishida yuboring');
      return;
    }

    // Создаем заказ через API
    const order: any = await apiRequest('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        restaurant_id: restaurantId,
        user_id: user.id,
        order_text: orderText,
        address,
        latitude,
        longitude
      })
    });

    // Получаем информацию о ресторане для уведомлений
    const restaurant: any = await apiRequest(`/api/restaurants/${restaurantId}`);
    const restaurantName = restaurant?.name || 'Noma\'lum restoran';

    // Отправляем заказ ресторану (повару)
    const messageId = await sendOrderToRestaurant(order.id, restaurantId, {
      orderText,
      address,
      user: ctx.from
    });

    // Сохраняем ID сообщения в БД
    await supabase
      .from('orders')
      .update({ telegram_message_id: messageId })
      .eq('id', order.id);

    // Уведомляем админов ресторана о новом заказе
    await notifyRestaurantAdminsAboutNewOrder(restaurantId, order.id, {
      orderText,
      address,
      user: ctx.from
    });

    // Очищаем сессию
    (ctx as any).session = {};

    // Уведомляем пользователя
    await ctx.reply(
      `✅ *Buyurtma yaratildi!*\n\n` +
      `📋 *Buyurtma tafsilotlari:*\n` +
      `Restoran: ${session.selectedRestaurantName}\n` +
      `Buyurtma: ${orderText}\n` +
      `Manzil: ${address}\n\n` +
      `⏳ Restorandan tasdiqlanishini kuting...\n` +
      `Buyurtma holati o'zgarganda sizga xabar beriladi.`,
      {
        parse_mode: 'Markdown',
        reply_markup: { remove_keyboard: true }
      }
    );
  } catch (error: any) {
    console.error('Error in location handler:', error);
      await ctx.reply('Buyurtma yaratishda xatolik yuz berdi. Keyinroq urinib ko\'ring yoki qaytadan boshlang: /start');
  }
}

/**
 * Получить пользователя по Telegram ID
 */
async function getUserByTelegramId(telegramId: number) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  return data;
}

/**
 * Создать нового пользователя
 */
async function createUser(telegramUser: any) {
  const { data } = await supabase
    .from('users')
    .insert({
      telegram_id: telegramUser.id,
      username: telegramUser.username || null,
      first_name: telegramUser.first_name || null,
      last_name: telegramUser.last_name || null
    })
    .select()
    .single();

  return data;
}

