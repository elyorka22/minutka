// ============================================
// Telegram Notification Service
// Отправка уведомлений через Telegram Bot API
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
    const errorData = await response.json() as { description?: string };
    throw new Error(`Telegram API error: ${errorData.description || response.statusText}`);
  }

  const data = await response.json() as { result: { message_id: number } };
  return data.result.message_id;
}

/**
 * Отправить заказ повару (chef)
 */
export async function sendOrderToChef(
  orderId: string,
  restaurantId: string,
  orderData: {
    orderText: string;
    address: string | null;
    userName?: string;
  }
): Promise<number | null> {
  try {
    // Получаем активных поваров для ресторана
    const { data: chefs, error: chefsError } = await supabase
      .from('chefs')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .not('telegram_chat_id', 'is', null);

    if (chefsError || !chefs || chefs.length === 0) {
      console.warn('No active chefs found for restaurant', restaurantId);
      return null;
    }

    // Отправляем заказ первому активному повару
    const chef = chefs[0];

    // Формируем сообщение для повара
    const userInfo = orderData.userName || 'Foydalanuvchi';

    const message = `📋 *Yangi buyurtma*\n\n` +
      `🆔 Buyurtma: #${orderId.slice(0, 8)}\n` +
      `👤 Mijoz: ${userInfo}\n` +
      `📝 Buyurtma: ${orderData.orderText}\n` +
      `📍 Manzil: ${orderData.address || 'Ko\'rsatilmagan'}\n\n` +
      `Amalni tanlang:`;

    // Создаем клавиатуру действий (только для поваров: принять и готово)
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
    // Преобразуем telegram_chat_id в число, если это BigInt
    const chatId = typeof chef.telegram_chat_id === 'bigint' 
      ? Number(chef.telegram_chat_id) 
      : chef.telegram_chat_id!;
    
    const messageId = await sendTelegramMessage(
      chatId,
      message,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    );

    return messageId;
  } catch (error: any) {
    console.error('Error sending order to chef:', error);
    return null;
  }
}

/**
 * Уведомить пользователя об изменении статуса заказа
 */
export async function notifyUserAboutOrderStatus(
  userId: string,
  orderId: string,
  newStatus: string
): Promise<void> {
  try {
    // Получаем пользователя
    const { data: user } = await supabase
      .from('users')
      .select('telegram_id')
      .eq('id', userId)
      .single();

    if (!user || !user.telegram_id) {
      console.warn('User not found or has no telegram_id for notification');
      return;
    }

    // Формируем сообщение
    const statusMessages: Record<string, string> = {
      accepted: '✅ *Buyurtmangiz qabul qilindi!*\n\nRestoran buyurtmangizni tayyorlashni boshladi.',
      ready: '🚀 *Buyurtmangiz tayyor!*\n\nYetkazib berishni kuting.',
      cancelled: '❌ *Buyurtma bekor qilindi*\n\nRestoran buyurtmangizni bajarolmaydi.',
      delivered: '✅ *Buyurtma yetkazildi!*\n\nMazali bo\'lsin!'
    };

    const message = statusMessages[newStatus] || `📋 Buyurtma holati o'zgardi: ${newStatus}`;

    await sendTelegramMessage(
      user.telegram_id,
      message,
      { parse_mode: 'Markdown' }
    );
  } catch (error: any) {
    console.error('Error notifying user about order status:', error);
  }
}

/**
 * Уведомить супер-админов о новом заказе
 */
export async function notifySuperAdminsAboutNewOrder(
  orderId: string,
  orderData: {
    restaurantName: string;
    orderText: string;
    address: string | null;
    userName?: string;
  }
): Promise<void> {
  try {
    // Получаем всех активных супер-админов
    const { data: superAdmins, error } = await supabase
      .from('super_admins')
      .select('telegram_id')
      .eq('is_active', true);

    if (error || !superAdmins || superAdmins.length === 0) {
      return;
    }

    const userInfo = orderData.userName || 'Foydalanuvchi';

    const message = `📋 *Yangi buyurtma yaratildi*\n\n` +
      `🆔 Buyurtma: #${orderId.slice(0, 8)}\n` +
      `🍽️ Restoran: ${orderData.restaurantName}\n` +
      `👤 Mijoz: ${userInfo}\n` +
      `📝 Buyurtma: ${orderData.orderText}\n` +
      `📍 Manzil: ${orderData.address || 'Ko\'rsatilmagan'}\n\n` +
      `Holat: ⏳ Tasdiqlanishni kutmoqda`;

    // Отправляем уведомление всем супер-админам
    const notificationPromises = superAdmins.map(async (admin) => {
      try {
        await sendTelegramMessage(admin.telegram_id, message, { parse_mode: 'Markdown' });
      } catch (error: any) {
        console.error(`Error sending notification to super admin ${admin.telegram_id}:`, error);
      }
    });

    await Promise.all(notificationPromises);
  } catch (error: any) {
    console.error('Error notifying super admins:', error);
  }
}

/**
 * Уведомить админов ресторана о новом заказе
 */
export async function notifyRestaurantAdminsAboutNewOrder(
  restaurantId: string,
  orderId: string,
  orderData: {
    orderText: string;
    address: string | null;
    userName?: string;
  }
): Promise<void> {
  try {
    // Получаем всех активных админов ресторана
    const { data: admins, error } = await supabase
      .from('restaurant_admins')
      .select('telegram_id')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true);

    if (error || !admins || admins.length === 0) {
      return;
    }

    const userInfo = orderData.userName || 'Foydalanuvchi';

    const message = `📋 *Yangi buyurtma yaratildi*\n\n` +
      `🆔 Buyurtma: #${orderId.slice(0, 8)}\n` +
      `👤 Mijoz: ${userInfo}\n` +
      `📝 Buyurtma: ${orderData.orderText}\n` +
      `📍 Manzil: ${orderData.address || 'Ko\'rsatilmagan'}\n\n` +
      `Holat: ⏳ Tasdiqlanishni kutmoqda`;

    // Отправляем уведомление всем админам ресторана
    const notificationPromises = admins.map(async (admin) => {
      try {
        await sendTelegramMessage(admin.telegram_id, message, { parse_mode: 'Markdown' });
      } catch (error: any) {
        console.error(`Error sending notification to restaurant admin ${admin.telegram_id}:`, error);
      }
    });

    await Promise.all(notificationPromises);
  } catch (error: any) {
    console.error('Error notifying restaurant admins:', error);
  }
}

