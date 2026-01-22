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

  // Формируем сообщение
  const statusMessages: Record<string, string> = {
    accepted: '✅ *Buyurtmangiz qabul qilindi!*\n\nRestoran buyurtmangizni tayyorlashni boshladi.',
    ready: '🚀 *Buyurtmangiz tayyor!*\n\nYetkazib berishni kuting.',
    cancelled: '❌ *Buyurtma bekor qilindi*\n\nRestoran buyurtmangizni bajarolmaydi.',
    delivered: '✅ *Buyurtma yetkazildi!*\n\nMazali bo\'lsin!'
  };

  const message = statusMessages[newStatus] || `📋 Buyurtma holati o'zgardi: ${newStatus}`;

  try {
    await botInstance.telegram.sendMessage(
      user.telegram_id,
      message,
      { parse_mode: 'Markdown' }
    );
  } catch (error: any) {
    console.error('Error sending notification to user:', error);
  }
}

