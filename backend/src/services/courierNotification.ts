// ============================================
// Courier Notification Service
// Уведомления курьерам о заказах
// ============================================

import { supabase } from '../config/supabase';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Отправить сообщение через Telegram Bot API
 */
async function sendTelegramMessage(chatId: number, message: string, options?: {
  parse_mode?: 'Markdown' | 'HTML';
  reply_markup?: any;
}): Promise<number> {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  }

  const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: options?.parse_mode,
      reply_markup: options?.reply_markup,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Telegram API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
  }

  return data.result.message_id;
}

/**
 * Уведомить всех активных курьеров о заказе
 * Кто первый нажмет кнопку "Взять заказ" - тот получит заказ, у остальных заказ исчезнет
 */
export async function notifyCouriersAboutOrder(
  orderId: string,
  orderData: {
    restaurantName: string;
    orderText: string;
    address: string | null;
    userPhone: string | null;
    total: string;
  }
): Promise<Array<{ courier_id: number; message_id: number }> | null> {
  try {
    // Получаем всех активных курьеров
    const { data: couriers, error } = await supabase
      .from('couriers')
      .select('telegram_id, telegram_chat_id, first_name')
      .eq('is_active', true)
      .not('telegram_chat_id', 'is', null);

    if (error) {
      console.error('Error fetching active couriers:', error);
      return null;
    }

    if (!couriers || couriers.length === 0) {
      console.log('No active couriers found');
      return null;
    }

    const userPhone = orderData.userPhone || 'Ko\'rsatilmagan';
    const address = orderData.address || 'Ko\'rsatilmagan';

    const message = `📦 *Yangi buyurtma*\n\n` +
      `🆔 Buyurtma: #${orderId.slice(0, 8)}\n` +
      `🍽️ Restoran: ${orderData.restaurantName}\n` +
      `💰 Narx: ${orderData.total}\n` +
      `📍 Manzil: ${address}\n` +
      `📝 Buyurtma: ${orderData.orderText}\n` +
      `📞 Mijoz: \`${userPhone}\`\n\n` +
      `⚠️ *Kim birinchi olsa, shu buyurtmani oladi!*`;

    // Создаем клавиатуру с кнопкой "Взять заказ"
    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Olmoq', callback_data: `courier:take:${orderId}` }
        ]
      ]
    };

    // Отправляем уведомление всем активным курьерам
    const notificationPromises = couriers.map(async (courier) => {
      try {
        const chatId = courier.telegram_chat_id || courier.telegram_id;
        const messageId = await sendTelegramMessage(
          chatId,
          message,
          {
            parse_mode: 'Markdown',
            reply_markup: keyboard
          }
        );
        console.log(`Sent order notification to courier ${courier.telegram_id}, message_id: ${messageId}`);
        return { courier_id: courier.telegram_id, message_id: messageId };
      } catch (error: any) {
        console.error(`Error sending notification to courier ${courier.telegram_id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(notificationPromises);
    const successful = results.filter(r => r !== null) as Array<{ courier_id: number; message_id: number }>;
    console.log(`Successfully notified ${successful.length} couriers about order ${orderId}`);
    
    return successful;
  } catch (error: any) {
    console.error('Error notifying couriers:', error);
    return null;
  }
}

