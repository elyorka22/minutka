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
 * Отправить заказ повару (chef) или админу ресторана
 * В зависимости от настроек ресторана
 */
export async function sendOrderToRestaurant(
  orderId: string,
  restaurantId: string,
  orderData: {
    orderText: string;
    address: string | null;
    user: any;
  }
): Promise<number | null> {
  if (!botInstance) {
    throw new Error('Bot instance not initialized');
  }

  // Получаем настройки ресторана только для проверки повара
  // Админы всегда получают уведомления
  const { data: restaurantData, error: restaurantError } = await supabase
    .from('restaurants')
    .select('chef_notifications_enabled')
    .eq('id', restaurantId)
    .single();

  // Используем значения по умолчанию, если настройки не найдены
  const restaurant = restaurantData || { chef_notifications_enabled: true };

  if (restaurantError) {
    console.error('Error fetching restaurant settings:', restaurantError);
  }

  const chefNotificationsEnabled = restaurant.chef_notifications_enabled ?? true;
  // Админы всегда получают уведомления
  const adminNotificationsEnabled = true;

  // Формируем информацию о пользователе
  const userInfo = orderData.user.username
    ? `@${orderData.user.username}`
    : `${orderData.user.first_name || 'Foydalanuvchi'}`;

  // Если уведомления для повара включены, отправляем повару
  if (chefNotificationsEnabled) {
    // Получаем активных поваров для ресторана
    const { data: chefs, error: chefsError } = await supabase
      .from('chefs')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .not('telegram_chat_id', 'is', null);

    if (!chefsError && chefs && chefs.length > 0) {
      // Отправляем заказ первому активному повару
      const chef = chefs[0];

      const message = `📋 *Yangi buyurtma*\n\n` +
        `🆔 Buyurtma: #${orderId.slice(0, 8)}\n` +
        `👤 Mijoz: ${userInfo}\n` +
        `📝 Buyurtma: ${orderData.orderText}\n` +
        `📍 Manzil: ${orderData.address || 'Ko\'rsatilmagan'}\n\n` +
        `Buyurtma tayyor bo'lganda "Tayyor" tugmasini bosing:`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🚀 Tayyor', callback_data: `order:delete:${orderId}` }
          ]
        ]
      };

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
  }

  // Если уведомления для повара выключены или поваров нет, отправляем админу
  if (!chefNotificationsEnabled && adminNotificationsEnabled) {
    // Получаем координаты заказа из БД
    const { data: order } = await supabase
      .from('orders')
      .select('latitude, longitude')
      .eq('id', orderId)
      .single();
    
    // Импортируем функцию уведомления админов о новом заказе
    const { notifyRestaurantAdminsAboutNewOrder } = await import('./adminNotification');
    
    await notifyRestaurantAdminsAboutNewOrder(
      restaurantId,
      orderId,
      {
        orderText: orderData.orderText,
        address: orderData.address,
        userName: userInfo,
        latitude: order?.latitude || null,
        longitude: order?.longitude || null
      }
    );

    // Возвращаем null, так как сообщение отправлено админу, а не повару
    return null;
  }

  // Если оба уведомления выключены, не отправляем ничего
  console.log('Both chef and admin notifications are disabled for restaurant:', restaurantId);
  return null;
}


