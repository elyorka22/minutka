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
 * Отправить заказ админам ресторана
 * (Ранее была функция sendOrderToChef, но поваров больше нет)
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
    // Получаем координаты заказа из БД
    const { data: order } = await supabase
      .from('orders')
      .select('latitude, longitude')
      .eq('id', orderId)
      .single();
    
    // Сразу отправляем уведомление админам (поваров больше нет)
    await notifyRestaurantAdminsAboutNewOrder(
      restaurantId,
      orderId,
      {
        orderText: orderData.orderText,
        address: orderData.address,
        userName: orderData.userName,
        latitude: order?.latitude || null,
        longitude: order?.longitude || null
      }
    );

    return null;
  } catch (error: any) {
    console.error('Error sending order to restaurant admins:', error);
    return null;
  }
}

/**
 * Уведомить пользователя по Telegram ID об изменении статуса заказа
 */
export async function notifyUserByTelegramId(
  telegramId: number,
  orderId: string,
  newStatus: string
): Promise<void> {
  try {
    // Получаем детали заказа для более информативного сообщения
    let orderDetails = null;
    try {
      const { data: order } = await supabase
        .from('orders')
        .select(`
          id,
          order_text,
          restaurant_id,
          restaurants(name)
        `)
        .eq('id', orderId)
        .single();
      
      orderDetails = order;
    } catch (error) {
      console.error('Error fetching order details for notification:', error);
    }

    // Формируем сообщение с деталями заказа
    const statusMessages: Record<string, string> = {
      accepted: '✅ *Buyurtmangiz qabul qilindi!*\n\nRestoran buyurtmangizni tayyorlashni boshladi.',
      ready: '🚀 *Buyurtmangiz tayyor!*\n\nYetkazib berishni kuting.',
      assigned_to_courier: '🚚 *Buyurtmangiz kuryerga topshirildi.*\n\nKuryer siz bilan bog\'lanadi.',
      cancelled: '❌ *Buyurtma bekor qilindi*\n\nRestoran buyurtmangizni bajarolmaydi.',
      delivered: '✅ *Yoqimli ishtaha. Biz bilan qulay, oson va tez*'
    };

    let message = statusMessages[newStatus] || `📋 Buyurtma holati o'zgardi: ${newStatus}`;
    
    // Для assigned_to_courier и delivered всегда добавляем данные о заказе
    if (orderDetails && (newStatus === 'assigned_to_courier' || newStatus === 'delivered')) {
      const restaurant = (orderDetails as any).restaurants;
      const restaurantName = restaurant?.name || 'Restoran';
      message += `\n\n🆔 Buyurtma: #${orderId.slice(0, 8)}\n🍽️ Restoran: ${restaurantName}`;
      
      // Парсим сумму из order_text
      const totalMatch = orderDetails.order_text.match(/Jami:\s*(\d+)/i) || 
                        orderDetails.order_text.match(/Total:\s*(\d+)/i) ||
                        orderDetails.order_text.match(/💰\s*(\d+)/i);
      if (totalMatch) {
        message += `\n💰 Jami: ${totalMatch[1]} so'm`;
      }
    }

    try {
      await sendTelegramMessage(
        telegramId,
        message,
        { parse_mode: 'Markdown' }
      );
      console.log(`Sent order status notification to telegram_id ${telegramId} for order ${orderId}, status: ${newStatus}`);
    } catch (error: any) {
      console.error('Error sending notification to user:', error);
      // Если пользователь заблокировал бота, это нормально - не логируем как критическую ошибку
      if (error.message?.includes('403') || error.message?.includes('blocked')) {
        console.log(`User ${telegramId} has blocked the bot, skipping notification`);
      }
    }
  } catch (error: any) {
    console.error('Error notifying user by telegram_id:', error);
  }
}

/**
 * Уведомить пользователя об изменении статуса заказа (через user_id)
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

    // Получаем детали заказа для более информативного сообщения
    let orderDetails = null;
    try {
      const { data: order } = await supabase
        .from('orders')
        .select(`
          id,
          order_text,
          restaurant_id,
          restaurants(name)
        `)
        .eq('id', orderId)
        .single();
      
      orderDetails = order;
    } catch (error) {
      console.error('Error fetching order details for notification:', error);
    }

    // Формируем сообщение с деталями заказа
    const statusMessages: Record<string, string> = {
      accepted: '✅ *Buyurtmangiz qabul qilindi!*\n\nRestoran buyurtmangizni tayyorlashni boshladi.',
      ready: '🚀 *Buyurtmangiz tayyor!*\n\nYetkazib berishni kuting.',
      assigned_to_courier: '🚚 *Buyurtmangiz kuryerga topshirildi.*\n\nKuryer siz bilan bog\'lanadi.',
      cancelled: '❌ *Buyurtma bekor qilindi*\n\nRestoran buyurtmangizni bajarolmaydi.',
      delivered: '✅ *Yoqimli ishtaha. Biz bilan qulay, oson va tez*'
    };

    let message = statusMessages[newStatus] || `📋 Buyurtma holati o'zgardi: ${newStatus}`;
    
    // Для assigned_to_courier и delivered всегда добавляем данные о заказе
    if (orderDetails && (newStatus === 'assigned_to_courier' || newStatus === 'delivered')) {
      const restaurant = (orderDetails as any).restaurants;
      const restaurantName = restaurant?.name || 'Restoran';
      message += `\n\n🆔 Buyurtma: #${orderId.slice(0, 8)}\n🍽️ Restoran: ${restaurantName}`;
      
      // Парсим сумму из order_text
      const totalMatch = orderDetails.order_text.match(/Jami:\s*(\d+)/i) || 
                        orderDetails.order_text.match(/Total:\s*(\d+)/i) ||
                        orderDetails.order_text.match(/💰\s*(\d+)/i);
      if (totalMatch) {
        message += `\n💰 Jami: ${totalMatch[1]} so'm`;
      }
    }

    try {
      await sendTelegramMessage(
        user.telegram_id,
        message,
        { parse_mode: 'Markdown' }
      );
      console.log(`Sent order status notification to user ${user.telegram_id} for order ${orderId}, status: ${newStatus}`);
    } catch (error: any) {
      console.error('Error sending notification to user:', error);
      // Если пользователь заблокировал бота, это нормально - не логируем как критическую ошибку
      if (error.message?.includes('403') || error.message?.includes('blocked')) {
        console.log(`User ${user.telegram_id} has blocked the bot, skipping notification`);
      }
    }
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
    latitude?: number | null;
    longitude?: number | null;
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

    // Создаем клавиатуру с кнопкой локации, если есть координаты
    const hasLocation = orderData.latitude && orderData.longitude;
    let keyboard: any = undefined;
    
    if (hasLocation) {
      const mapUrl = `https://www.google.com/maps?q=${orderData.latitude},${orderData.longitude}`;
      keyboard = {
        inline_keyboard: [
          [
            { text: '📍 Manzilni ko\'rish', url: mapUrl }
          ]
        ]
      };
    } else if (orderData.address) {
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(orderData.address)}`;
      keyboard = {
        inline_keyboard: [
          [
            { text: '📍 Manzilni ko\'rish', url: mapUrl }
          ]
        ]
      };
    }

    // Отправляем уведомление всем супер-админам
    const notificationPromises = superAdmins.map(async (admin) => {
      try {
        await sendTelegramMessage(admin.telegram_id, message, {
          parse_mode: 'Markdown',
          ...(keyboard ? { reply_markup: keyboard } : {})
        });
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
    latitude?: number | null;
    longitude?: number | null;
  }
): Promise<void> {
  try {
    // Админы всегда получают уведомления (убрана проверка admin_notifications_enabled)
    // Получаем всех активных админов ресторана
    let { data: admins, error } = await supabase
      .from('restaurant_admins')
      .select('telegram_id')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true);

    if (error || !admins || admins.length === 0) {
      console.log(`No active restaurant admins found for restaurant ${restaurantId}`);
      return;
    }

    // ВАЖНО: Исключаем курьеров из получения админских уведомлений
    const adminTelegramIds = admins.map(admin => admin.telegram_id);
    const { data: couriers, error: courierCheckError } = await supabase
      .from('couriers')
      .select('telegram_id')
      .in('telegram_id', adminTelegramIds)
      .eq('is_active', true);

    if (couriers && couriers.length > 0) {
      console.log(`[Backend Admin Notification] WARNING: Found ${couriers.length} users who are both admins and couriers. Excluding them from admin notifications.`);
      const courierTelegramIds = new Set(couriers.map(c => c.telegram_id));
      admins = admins.filter(admin => !courierTelegramIds.has(admin.telegram_id));
    }

    if (!admins || admins.length === 0) {
      console.log(`[Backend Admin Notification] No admins left after excluding couriers for restaurant ${restaurantId}`);
      return;
    }

    const userInfo = orderData.userName || 'Foydalanuvchi';

    const message = `📋 *Yangi buyurtma*\n\n` +
      `🆔 Buyurtma: #${orderId.slice(0, 8)}\n` +
      `👤 Mijoz: ${userInfo}\n` +
      `📝 Buyurtma: ${orderData.orderText}\n` +
      `📍 Manzil: ${orderData.address || 'Ko\'rsatilmagan'}\n\n` +
      `Holat: ⏳ Tasdiqlanishni kutmoqda`;

    // Создаем клавиатуру с кнопкой локации, если есть координаты или адрес
    const hasLocation = orderData.latitude && orderData.longitude;
    let keyboard: any = undefined;
    
    if (hasLocation) {
      const mapUrl = `https://www.google.com/maps?q=${orderData.latitude},${orderData.longitude}`;
      keyboard = {
        inline_keyboard: [
          [
            { text: '📍 Manzilni ko\'rish', url: mapUrl }
          ]
        ]
      };
    } else if (orderData.address) {
      // Если нет координат, но есть адрес, создаем ссылку на поиск по адресу
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(orderData.address)}`;
      keyboard = {
        inline_keyboard: [
          [
            { text: '📍 Manzilni ko\'rish', url: mapUrl }
          ]
        ]
      };
    }

    // Отправляем уведомление всем админам ресторана
    const notificationPromises = admins.map(async (admin) => {
      try {
        await sendTelegramMessage(admin.telegram_id, message, { 
          parse_mode: 'Markdown',
          ...(keyboard ? { reply_markup: keyboard } : {})
        });
      } catch (error: any) {
        console.error(`Error sending notification to restaurant admin ${admin.telegram_id}:`, error);
      }
    });

    await Promise.all(notificationPromises);
  } catch (error: any) {
    console.error('Error notifying restaurant admins:', error);
  }
}

