// ============================================
// Restaurant Notification Service
// Отправка заказов поварам (chefs)
// ============================================

import { Telegraf } from 'telegraf';
import { supabase } from '../config/supabase';
import { apiRequest } from '../config/api';
import { Restaurant, Order, Chef } from '../types';

let botInstance: Telegraf | null = null;

/**
 * Инициализация бота для отправки сообщений
 */
export function initBot(bot: Telegraf) {
  botInstance = bot;
}

/**
 * Отправить заказ повару (chef)
 * Теперь заказы отправляются поварам, а не ресторанам напрямую
 */
export async function sendOrderToRestaurant(
  orderId: string,
  restaurantId: string,
  orderData: {
    orderText: string;
    address: string | null;
    user: any;
  }
): Promise<number> {
  if (!botInstance) {
    throw new Error('Bot instance not initialized');
  }

  // Получаем активных поваров для ресторана
  const { data: chefs, error: chefsError } = await supabase
    .from('chefs')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .not('telegram_chat_id', 'is', null);

  if (chefsError || !chefs || chefs.length === 0) {
    throw new Error('No active chefs found for this restaurant or telegram_chat_id not set');
  }

  // Отправляем заказ первому активному повару (можно расширить для отправки всем)
  const chef = chefs[0];

  // Формируем сообщение для повара
  const userInfo = orderData.user.username
    ? `@${orderData.user.username}`
    : `${orderData.user.first_name || 'Foydalanuvchi'}`;

  const message = `📋 *Yangi buyurtma*\n\n` +
    `🆔 Buyurtma: #${orderId.slice(0, 8)}\n` +
    `👤 Mijoz: ${userInfo}\n` +
    `📝 Buyurtma: ${orderData.orderText}\n` +
    `📍 Manzil: ${orderData.address || 'Ko\'rsatilmagan'}\n\n` +
    `Amalni tanlang:`;

  // Создаем клавиатуру действий (только для поваров: принять и готово)
  // Повары не могут отменять заказы, поэтому кнопка "Отмена" отсутствует
  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Qabul qilish', callback_data: `order:accept:${orderId}` }
      ],
      [
        { text: '🚀 Tayyor', callback_data: `order:ready:${orderId}` }
      ]
    ]
  };

  // Отправляем сообщение повару
  const sentMessage = await botInstance.telegram.sendMessage(
    chef.telegram_chat_id!,
    message,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    }
  );

  return sentMessage.message_id;
}


