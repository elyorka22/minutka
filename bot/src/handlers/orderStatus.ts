// ============================================
// Order Status Handler - Обработка действий ресторана
// ============================================

import { Context } from 'telegraf';
import { apiRequest } from '../config/api';
import { supabase } from '../config/supabase';
import { notifyUserAboutOrderStatus } from '../services/userNotification';
import { notifySuperAdminsAboutOrderStatusChange } from '../services/adminNotification';

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

    console.log(`[orderStatusHandler] Processing order ${orderId}, action: ${action}, telegramId: ${telegramId}`);

    // Сначала проверяем, является ли пользователь активным поваром
    // Supabase автоматически конвертирует числа в BigInt для полей типа BIGINT
    const { data: chef, error: chefError } = await supabase
      .from('chefs')
      .select('*')
      .eq('telegram_id', telegramId)
      .eq('is_active', true)
      .maybeSingle();

    if (chefError) {
      console.error('[orderStatusHandler] Error fetching chef:', chefError);
      await ctx.answerCbQuery('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
      return;
    }

    console.log(`[orderStatusHandler] Chef lookup result:`, { 
      found: !!chef, 
      chefId: chef?.id,
      restaurantId: chef?.restaurant_id,
      isActive: chef?.is_active
    });

    if (!chef) {
      console.log(`[orderStatusHandler] Chef not found or inactive for telegramId: ${telegramId}`);
      // Попробуем найти повара без фильтра is_active для диагностики
      const { data: chefDebug } = await supabase
        .from('chefs')
        .select('*')
        .eq('telegram_id', telegramId)
        .maybeSingle();
      console.log(`[orderStatusHandler] Chef debug (without is_active filter):`, chefDebug);
      
      await ctx.answerCbQuery('Sizda bu buyurtmani boshqarish huquqi yo\'q. Iltimos, super-admin bilan bog\'laning.');
      return;
    }

    // Получаем заказ напрямую из Supabase (чтобы избежать циклической зависимости с аутентификацией)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    console.log(`[orderStatusHandler] Order lookup result:`, { 
      found: !!order, 
      error: orderError,
      orderRestaurantId: order?.restaurant_id,
      chefRestaurantId: chef.restaurant_id
    });

    if (orderError) {
      console.error('[orderStatusHandler] Error fetching order:', orderError);
    }

    if (orderError || !order) {
      await ctx.answerCbQuery('Buyurtma topilmadi');
      return;
    }

    // Проверяем, что заказ принадлежит ресторану повара
    if (order.restaurant_id !== chef.restaurant_id) {
      console.log(`[orderStatusHandler] Restaurant mismatch: order belongs to ${order.restaurant_id}, chef belongs to ${chef.restaurant_id}`);
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
      headers: {
        'x-telegram-id': String(telegramId)
      },
      body: JSON.stringify({
        status: newStatus,
        changed_by: 'restaurant',
        telegram_id: telegramId
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

    // Уведомляем супер-админов об изменении статуса
    const restaurant: any = await apiRequest(`/api/restaurants/${order.restaurant_id}`);
    const restaurantName = restaurant?.name || 'Noma\'lum restoran';
    await notifySuperAdminsAboutOrderStatusChange(orderId, newStatus, {
      restaurantName,
      orderText: order.order_text
    });
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

