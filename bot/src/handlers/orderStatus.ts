// ============================================
// Order Status Handler - Обработка действий ресторана
// ============================================

import { Context } from 'telegraf';
import { apiRequest } from '../config/api';
import { supabase } from '../config/supabase';
import { notifyUserAboutOrderStatus } from '../services/userNotification';

/**
 * Обработчик действий повара (chef) с заказом
 * Повары могут только принимать заказы (accept) и отмечать как готовые (ready)
 * @param ctx - контекст Telegram
 * @param orderId - ID заказа
 * @param action - действие: accept, ready (повары не могут отменять заказы)
 */
export async function orderStatusHandler(
  ctx: Context,
  orderId: string,
  action: string
) {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.answerCbQuery('Foydalanuvchi aniqlanmadi');
      return;
    }

    // Получаем заказ
    const order: any = await apiRequest(`/api/orders/${orderId}`);

    if (!order) {
      await ctx.answerCbQuery('Buyurtma topilmadi');
      return;
    }

    // Проверяем, является ли пользователь поваром для этого ресторана
    const { data: chef } = await supabase
      .from('chefs')
      .select('*')
      .eq('restaurant_id', order.restaurant_id)
      .eq('telegram_id', telegramId)
      .eq('is_active', true)
      .single();

    if (!chef) {
      await ctx.answerCbQuery('Sizda bu buyurtmani boshqarish huquqi yo\'q');
      return;
    }

    // Повары могут только принимать заказы и отмечать как готовые
    // Они не могут отменять заказы
    let newStatus: string;
    let message: string;

    switch (action) {
      case 'accept':
        newStatus = 'accepted';
        message = '✅ Buyurtma qabul qilindi!';
        break;
      case 'ready':
        // Проверяем, что заказ уже принят
        if (order.status !== 'accepted') {
          await ctx.answerCbQuery('Avval buyurtmani qabul qiling!');
          return;
        }
        newStatus = 'ready';
        message = '✅ Buyurtma tayyor!';
        break;
      case 'cancel':
        // Повары не могут отменять заказы
        await ctx.answerCbQuery('Povarlar buyurtmalarni bekor qila olmaydi');
        return;
      default:
        await ctx.answerCbQuery('Noma\'lum amal');
        return;
    }

    // Обновляем статус через API
    await apiRequest(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: newStatus,
        changed_by: 'restaurant',
        telegram_id: ctx.from?.id
      })
    });

    await ctx.answerCbQuery(message);

    // Обновляем сообщение с заказом
    const statusEmoji = {
      accepted: '✅',
      ready: '🚀',
      cancelled: '❌'
    }[newStatus] || '📋';

    await ctx.editMessageText(
      `${statusEmoji} *Buyurtma holati yangilandi*\n\n` +
      `Buyurtma #${orderId.slice(0, 8)}\n` +
      `Holat: ${getStatusText(newStatus)}\n\n` +
      `Joriy holat: ${getStatusText(newStatus)}`,
      { parse_mode: 'Markdown' }
    );

    // Уведомляем пользователя об изменении статуса
    await notifyUserAboutOrderStatus(order.user_id, orderId, newStatus);
  } catch (error: any) {
    console.error('Error in order status handler:', error);
      await ctx.answerCbQuery('Holatni yangilashda xatolik');
  }
}

/**
 * Получить текстовое описание статуса
 */
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '⏳ Tasdiqlanishni kutmoqda',
    accepted: '✅ Qabul qilindi',
    ready: '🚀 Yetkazib berishga tayyor',
    delivered: '✅ Yetkazildi',
    cancelled: '❌ Bekor qilindi'
  };
  return statusMap[status] || status;
}

