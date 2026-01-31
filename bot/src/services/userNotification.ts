// ============================================
// User Notification Service
// Уведомления пользователей об изменении статуса заказа
// ============================================

import { Telegraf } from 'telegraf';
import { supabase } from '../config/supabase';
import { apiRequest } from '../config/api';
import { Order } from '../types';

let botInstance: Telegraf | null = null;

/**
 * Инициализация бота для отправки уведомлений
 */
export function initBot(bot: Telegraf) {
  botInstance = bot;
}

/**
 * Уведомить пользователя об изменении статуса заказа
 */
export async function notifyUserAboutOrderStatus(
  userId: string,
  orderId: string,
  newStatus: string
) {
  if (!botInstance) {
    throw new Error('Bot instance not initialized');
  }

  // Получаем пользователя
  const { data: user } = await supabase
    .from('users')
    .select('telegram_id')
    .eq('id', userId)
    .single();

  if (!user || !user.telegram_id) {
    console.error('User not found for notification');
    return;
  }

  // Получаем детали заказа
  const order = await apiRequest<Order>(`/api/orders/${orderId}`);

  // Получаем детали заказа для более информативного сообщения
  let orderDetails = null;
  try {
    orderDetails = await apiRequest<Order>(`/api/orders/${orderId}`);
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
    const restaurantName = (orderDetails as any).restaurants?.name || 'Restoran';
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
    await botInstance.telegram.sendMessage(
      user.telegram_id,
      message,
      { parse_mode: 'Markdown' }
    );
    console.log(`Sent order status notification to user ${user.telegram_id} for order ${orderId}, status: ${newStatus}`);
  } catch (error: any) {
    console.error('Error sending notification to user:', error);
    // Если пользователь заблокировал бота, это нормально - не логируем как ошибку
    if (error.response?.error_code === 403) {
      console.log(`User ${user.telegram_id} has blocked the bot, skipping notification`);
    }
  }
}

