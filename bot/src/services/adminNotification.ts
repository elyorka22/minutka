// ============================================
// Admin Notification Service
// Уведомления супер-админам и админам ресторанов о заказах
// ============================================

import { Telegraf } from 'telegraf';
import { Markup } from 'telegraf';
import { supabase } from '../config/supabase';
import { apiRequest } from '../config/api';
import { Order, Restaurant } from '../types';

let botInstance: Telegraf | null = null;

/**
 * Инициализация бота для отправки уведомлений
 */
export function initBot(bot: Telegraf) {
  botInstance = bot;
}

/**
 * Уведомить супер-админов о новом заказе
 */
export async function notifySuperAdminsAboutNewOrder(orderId: string, orderData: {
  restaurantName: string;
  orderText: string;
  address: string | null;
  user: any;
}) {
  if (!botInstance) {
    console.warn('Bot instance not initialized for admin notifications');
    return;
  }

  try {
    // Получаем всех активных супер-админов
    const { data: superAdmins, error } = await supabase
      .from('super_admins')
      .select('telegram_id')
      .eq('is_active', true);

    if (error || !superAdmins || superAdmins.length === 0) {
      console.log('No active super admins found');
      return;
    }

    const userInfo = orderData.user.username
      ? `@${orderData.user.username}`
      : `${orderData.user.first_name || 'Foydalanuvchi'}`;

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
        await botInstance!.telegram.sendMessage(
          admin.telegram_id,
          message,
          { parse_mode: 'Markdown' }
        );
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
 * Уведомить админов ресторана о готовом заказе (после нажатия поваром "Tayyor")
 * Отправляет уведомление с кнопкой "Доставлен"
 */
export async function notifyRestaurantAdminsAboutReadyOrder(
  restaurantId: string,
  orderId: string,
  orderData: {
    orderText: string;
    address: string | null;
    userName?: string;
  }
) {
  console.log('=== notifyRestaurantAdminsAboutReadyOrder called ===');
  console.log('Parameters:', { restaurantId, orderId, orderData });
  
  if (!botInstance) {
    console.error('Bot instance not initialized for admin notifications!');
    return;
  }

  console.log('Bot instance is initialized, proceeding...');

  try {
    // Получаем всех активных админов ресторана
    const { data: allAdmins, error: allAdminsError } = await supabase
      .from('restaurant_admins')
      .select('telegram_id, notifications_enabled, is_active')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true);

    if (allAdminsError) {
      console.error('Error fetching restaurant admins:', allAdminsError);
      return;
    }

    if (!allAdmins || allAdmins.length === 0) {
      console.log(`No active restaurant admins found for restaurant ${restaurantId}`);
      return;
    }

    // Фильтруем админов с включенными уведомлениями
    // Проверяем, что notifications_enabled === true (не null, не false)
    const admins = allAdmins.filter(admin => {
      const enabled = admin.notifications_enabled === true;
      console.log(`Admin ${admin.telegram_id}: notifications_enabled = ${admin.notifications_enabled}, enabled = ${enabled}`);
      return enabled;
    });

    console.log(`Found ${allAdmins.length} active restaurant admins, ${admins.length} with notifications enabled`);
    console.log('Admins with notifications enabled:', admins.map(a => ({ telegram_id: a.telegram_id, notifications_enabled: a.notifications_enabled })));

    if (admins.length === 0) {
      console.log(`No restaurant admins with notifications enabled found for restaurant ${restaurantId}`);
      return;
    }

    const userInfo = orderData.userName || 'Foydalanuvchi';

    const message = `📋 *Buyurtma tayyor!*\n\n` +
      `🆔 Buyurtma: #${orderId.slice(0, 8)}\n` +
      `👤 Mijoz: ${userInfo}\n` +
      `📝 Buyurtma: ${orderData.orderText}\n` +
      `📍 Manzil: ${orderData.address || 'Ko\'rsatilmagan'}\n\n` +
      `Holat: 🚀 Tayyor`;

    // Создаем клавиатуру с кнопкой "Доставлен" используя Markup
    const keyboard = Markup.inlineKeyboard([
      Markup.button.callback('✅ Доставлен', `order:delivered:${orderId}`)
    ]);

    console.log(`Sending notification to ${admins.length} restaurant admins with keyboard:`, JSON.stringify(keyboard.reply_markup));

    // Отправляем уведомление всем админам ресторана
    const notificationPromises = admins.map(async (admin) => {
      try {
        console.log(`Sending notification to restaurant admin ${admin.telegram_id} for order ${orderId}`);
        const result = await botInstance!.telegram.sendMessage(
          admin.telegram_id,
          message,
          {
            parse_mode: 'Markdown',
            reply_markup: keyboard.reply_markup
          }
        );
        console.log(`Successfully sent notification to restaurant admin ${admin.telegram_id}, message_id: ${result.message_id}`);
      } catch (error: any) {
        console.error(`Error sending notification to restaurant admin ${admin.telegram_id}:`, error);
      }
    });

    await Promise.all(notificationPromises);
  } catch (error: any) {
    console.error('Error notifying restaurant admins:', error);
  }
}

/**
 * Уведомить супер-админов об изменении статуса заказа
 */
export async function notifySuperAdminsAboutOrderStatusChange(
  orderId: string,
  newStatus: string,
  orderData: {
    restaurantName: string;
    orderText: string;
  }
) {
  if (!botInstance) {
    return;
  }

  try {
    const { data: superAdmins } = await supabase
      .from('super_admins')
      .select('telegram_id')
      .eq('is_active', true);

    if (!superAdmins || superAdmins.length === 0) {
      return;
    }

    const statusMessages: Record<string, string> = {
      accepted: '✅ Qabul qilindi',
      ready: '🚀 Tayyor',
      delivered: '✅ Yetkazildi',
      cancelled: '❌ Bekor qilindi'
    };

    const statusText = statusMessages[newStatus] || newStatus;

    const message = `📋 *Buyurtma holati o'zgardi*\n\n` +
      `🆔 Buyurtma: #${orderId.slice(0, 8)}\n` +
      `🍽️ Restoran: ${orderData.restaurantName}\n` +
      `📝 Buyurtma: ${orderData.orderText}\n` +
      `🔄 Yangi holat: ${statusText}`;

    const notificationPromises = superAdmins.map(async (admin) => {
      try {
        await botInstance!.telegram.sendMessage(
          admin.telegram_id,
          message,
          { parse_mode: 'Markdown' }
        );
      } catch (error: any) {
        console.error(`Error sending status notification to super admin ${admin.telegram_id}:`, error);
      }
    });

    await Promise.all(notificationPromises);
  } catch (error: any) {
    console.error('Error notifying super admins about status change:', error);
  }
}


