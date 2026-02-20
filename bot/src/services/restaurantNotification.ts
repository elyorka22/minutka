// ============================================
// Restaurant Notification Service
// Отправка заказов админам ресторанов
// ============================================

import { Telegraf } from 'telegraf';
import { supabase } from '../config/supabase';
import { apiRequest } from '../config/api';
import { Restaurant, Order } from '../types';

let botInstance: Telegraf | null = null;

/**
 * Инициализация бота для отправки сообщений
 */
export function initBot(bot: Telegraf) {
  botInstance = bot;
}

/**
 * Отправить заказ админам ресторана
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

  // Формируем информацию о пользователе
  const userInfo = orderData.user.username
    ? `@${orderData.user.username}`
    : `${orderData.user.first_name || 'Foydalanuvchi'}`;

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

  // Возвращаем null, так как сообщение отправлено админу
  return null;
}


