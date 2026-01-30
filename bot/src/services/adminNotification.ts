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
 * Отправляет уведомление с кнопкой "Передать курьеру"
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

    // Создаем клавиатуру с кнопкой "Передать курьеру" используя Markup
    const keyboard = Markup.inlineKeyboard([
      Markup.button.callback('🚚 Передать курьеру', `order:assign_courier:${orderId}`)
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
      assigned_to_courier: '🚚 Kuryerga yuborildi',
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
) {
  if (!botInstance) {
    console.error('Bot instance not initialized for courier notifications');
    return;
  }

  try {
    // Получаем всех активных курьеров
    const { data: couriers, error } = await supabase
      .from('couriers')
      .select('telegram_id, telegram_chat_id, first_name')
      .eq('is_active', true)
      .not('telegram_chat_id', 'is', null);

    if (error) {
      console.error('Error fetching active couriers:', error);
      return;
    }

    if (!couriers || couriers.length === 0) {
      console.log('No active couriers found');
      return;
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
    const keyboard = Markup.inlineKeyboard([
      Markup.button.callback('✅ Olmoq', `courier:take:${orderId}`)
    ]);

    // Отправляем уведомление всем активным курьерам
    const notificationPromises = couriers.map(async (courier) => {
      try {
        const chatId = courier.telegram_chat_id || courier.telegram_id;
        const result = await botInstance!.telegram.sendMessage(
          chatId,
          message,
          {
            parse_mode: 'Markdown',
            reply_markup: keyboard.reply_markup
          }
        );
        console.log(`Sent order notification to courier ${courier.telegram_id}, message_id: ${result.message_id}`);
        return { courier_id: courier.telegram_id, message_id: result.message_id };
      } catch (error: any) {
        console.error(`Error sending notification to courier ${courier.telegram_id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(notificationPromises);
    const successful = results.filter(r => r !== null) as Array<{ courier_id: number; message_id: number }>;
    console.log(`Successfully notified ${successful.length} couriers about order ${orderId}`);
    
    // Сохраняем информацию о сообщениях для последующего удаления
    const { saveCourierOrderMessages } = await import('../handlers/courier');
    saveCourierOrderMessages(orderId, successful);
    
    return successful;
  } catch (error: any) {
    console.error('Error notifying couriers:', error);
  }
}

/**
 * Удалить сообщение о заказе у всех курьеров, кроме того, кто взял заказ
 */
export async function removeOrderFromOtherCouriers(
  orderId: string,
  takenByCourierId: number,
  courierMessages: Array<{ courier_id: number; message_id: number }>
) {
  if (!botInstance) {
    return;
  }

  try {
    // Удаляем сообщения у всех курьеров, кроме того, кто взял заказ
    const deletePromises = courierMessages
      .filter(msg => msg.courier_id !== takenByCourierId)
      .map(async (msg) => {
        try {
          const courier = await supabase
            .from('couriers')
            .select('telegram_chat_id, telegram_id')
            .eq('telegram_id', msg.courier_id)
            .single();

          if (courier.data) {
            const chatId = courier.data.telegram_chat_id || courier.data.telegram_id;
            await botInstance!.telegram.deleteMessage(chatId, msg.message_id);
            console.log(`Removed order notification from courier ${msg.courier_id}`);
          }
        } catch (error: any) {
          console.error(`Error removing message from courier ${msg.courier_id}:`, error);
        }
      });

    await Promise.all(deletePromises);
  } catch (error: any) {
    console.error('Error removing order from other couriers:', error);
  }
}

