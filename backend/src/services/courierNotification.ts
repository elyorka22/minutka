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
    const errorData = await response.json().catch(() => ({})) as { description?: string };
    throw new Error(`Telegram API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data = await response.json() as { ok: boolean; result?: { message_id: number }; description?: string };
  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
  }

  if (!data.result) {
    throw new Error('Telegram API error: No result in response');
  }

  return data.result.message_id;
}

/**
 * Уведомить активных курьеров о заказе
 * Кто первый нажмет кнопку "Взять заказ" - тот получит заказ, у остальных заказ исчезнет
 * @param restaurantId - если указан, уведомляются только курьеры этого ресторана, иначе - общие курьеры (restaurant_id IS NULL)
 */
export async function notifyCouriersAboutOrder(
  orderId: string,
  orderData: {
    restaurantName: string;
    orderText: string;
    address: string | null;
    userPhone: string | null;
    total: string;
  },
  restaurantId?: string | null
): Promise<Array<{ courier_id: number; message_id: number }> | null> {
  try {
    console.log(`[Courier Notification] Starting notification for order ${orderId}, restaurantId: ${restaurantId || 'general'}`);
    
    // Получаем активных курьеров
    // Если restaurantId указан - только курьеры этого ресторана
    // Если restaurantId не указан (null/undefined) - только общие курьеры (restaurant_id IS NULL)
    let query = supabase
      .from('couriers')
      .select('telegram_id, telegram_chat_id, first_name, is_active, restaurant_id')
      .eq('is_active', true);
    
    if (restaurantId) {
      // Уведомляем только курьеров этого ресторана
      query = query.eq('restaurant_id', restaurantId);
      console.log(`[Courier Notification] Filtering couriers for restaurant ${restaurantId}`);
    } else {
      // Уведомляем только общих курьеров (restaurant_id IS NULL)
      query = query.is('restaurant_id', null);
      console.log(`[Courier Notification] Filtering general couriers (restaurant_id IS NULL)`);
    }
    
    const { data: couriers, error } = await query;

    if (error) {
      console.error('[Courier Notification] Error fetching active couriers:', error);
      return null;
    }

    console.log(`[Courier Notification] Found ${couriers?.length || 0} active couriers`);

    if (!couriers || couriers.length === 0) {
      console.log('[Courier Notification] No active couriers found');
      return null;
    }

    // Фильтруем курьеров - нужен хотя бы telegram_id или telegram_chat_id
    const validCouriers = couriers.filter(courier => courier.telegram_id || courier.telegram_chat_id);
    
    if (validCouriers.length === 0) {
      console.log('[Courier Notification] No valid couriers found (no telegram_id or telegram_chat_id)');
      return null;
    }

    // Логируем информацию о курьерах
    validCouriers.forEach(courier => {
      console.log(`[Courier Notification] Courier: telegram_id=${courier.telegram_id}, telegram_chat_id=${courier.telegram_chat_id}, is_active=${courier.is_active}`);
    });

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
    const notificationPromises = validCouriers.map(async (courier) => {
      try {
        const chatId = courier.telegram_chat_id || courier.telegram_id;
        console.log(`[Courier Notification] Attempting to send message to courier ${courier.telegram_id}, chat_id: ${chatId}`);
        
        if (!chatId) {
          console.error(`[Courier Notification] No chat_id for courier ${courier.telegram_id}`);
          return null;
        }

        const messageId = await sendTelegramMessage(
          chatId,
          message,
          {
            parse_mode: 'Markdown',
            reply_markup: keyboard
          }
        );
        console.log(`[Courier Notification] Successfully sent order notification to courier ${courier.telegram_id}, message_id: ${messageId}`);
        return { courier_id: courier.telegram_id, message_id: messageId };
      } catch (error: any) {
        console.error(`[Courier Notification] Error sending notification to courier ${courier.telegram_id}:`, error.message || error);
        return null;
      }
    });

    const results = await Promise.all(notificationPromises);
    const successful = results.filter(r => r !== null) as Array<{ courier_id: number; message_id: number }>;
    console.log(`[Courier Notification] Successfully notified ${successful.length} out of ${validCouriers.length} couriers about order ${orderId}`);
    
    if (successful.length === 0) {
      console.warn(`[Courier Notification] No couriers were successfully notified about order ${orderId}`);
    }
    
    return successful;
  } catch (error: any) {
    console.error('[Courier Notification] Error notifying couriers:', error.message || error);
    return null;
  }
}

