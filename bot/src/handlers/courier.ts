// ============================================
// Courier Handler - Обработка действий курьера
// ============================================

import { Context } from 'telegraf';
import { supabase } from '../config/supabase';
import { apiRequest } from '../config/api';
import { removeOrderFromOtherCouriers } from '../services/adminNotification';
import { createCourierMenuKeyboard } from '../keyboards/courierMenu';

// Хранилище для сообщений курьеров о заказах
// В production лучше использовать Redis или БД
const courierOrderMessages: Map<string, Array<{ courier_id: number; message_id: number }>> = new Map();

/**
 * Обработчик активации/деактивации курьера (для текстовых сообщений)
 */
export async function courierToggleActiveHandler(ctx: Context) {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply('❌ Foydalanuvchi aniqlanmadi');
      return;
    }

    // Проверяем, что пользователь является курьером
    const { data: courier, error: courierError } = await supabase
      .from('couriers')
      .select('id, telegram_id, is_active')
      .eq('telegram_id', telegramId)
      .single();

    if (courierError || !courier) {
      await ctx.reply('❌ Siz kuryer emassiz');
      return;
    }

    // Переключаем статус
    const newStatus = !courier.is_active;
    const { error: updateError } = await supabase
      .from('couriers')
      .update({ is_active: newStatus })
      .eq('id', courier.id);

    if (updateError) {
      console.error('Error updating courier status:', updateError);
      await ctx.reply('❌ Xatolik yuz berdi');
      return;
    }

    const statusText = newStatus ? '✅ Faollashtirildi' : '❌ O\'chirildi';
    const keyboard = createCourierMenuKeyboard(newStatus);
    
    await ctx.reply(
      `🚚 *Kuryer paneli*\n\n` +
      `Holat: ${newStatus ? '✅ Faol' : '❌ Nofaol'}\n\n` +
      `${newStatus ? 'Siz endi buyurtmalarni olishingiz mumkin.' : 'Siz buyurtmalarni ololmaysiz.'}\n\n` +
      `${statusText}`,
      {
        parse_mode: 'Markdown',
        ...keyboard
      }
    );
  } catch (error: any) {
    console.error('Error in courier toggle active handler:', error);
    await ctx.reply('Xatolik yuz berdi');
  }
}

/**
 * Сохранить информацию о сообщениях курьеров для заказа
 */
export function saveCourierOrderMessages(orderId: string, messages: Array<{ courier_id: number; message_id: number }>) {
  courierOrderMessages.set(orderId, messages);
}

/**
 * Обработчик действий курьера с заказом
 * @param ctx - контекст Telegram
 * @param orderId - ID заказа
 * @param action - действие: take (курьер нажал "Взять заказ")
 */
export async function courierHandler(
  ctx: Context,
  orderId: string,
  action: string
) {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.answerCbQuery('❌ Foydalanuvchi aniqlanmadi');
      return;
    }

    // Курьер нажал "Взять заказ"
    if (action === 'take') {
      // Проверяем, что пользователь является активным курьером
      const { data: courier, error: courierError } = await supabase
        .from('couriers')
        .select('id, telegram_id, is_active')
        .eq('telegram_id', telegramId)
        .eq('is_active', true)
        .single();

      if (courierError || !courier) {
        await ctx.answerCbQuery('❌ Siz faol kuryer emassiz');
        return;
      }

      // Проверяем, не взят ли уже заказ другим курьером
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, status, courier_id')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        await ctx.answerCbQuery('❌ Buyurtma topilmadi');
        return;
      }

      if (order.status !== 'assigned_to_courier') {
        await ctx.answerCbQuery('❌ Bu buyurtma allaqachon boshqa holatda');
        return;
      }

      if (order.courier_id && order.courier_id !== courier.id) {
        await ctx.answerCbQuery('❌ Bu buyurtma allaqachon boshqa kuryer tomonidan olingan');
        // Удаляем сообщение у этого курьера
        try {
          await ctx.deleteMessage();
        } catch (error) {
          console.error('Error deleting message:', error);
        }
        return;
      }

      // Обновляем заказ - назначаем курьера
      const { error: updateError } = await supabase
        .from('orders')
        .update({ courier_id: courier.id })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating order with courier:', updateError);
        await ctx.answerCbQuery('❌ Xatolik yuz berdi');
        return;
      }

      // Удаляем сообщения у остальных курьеров
      const messages = courierOrderMessages.get(orderId);
      if (messages) {
        await removeOrderFromOtherCouriers(orderId, telegramId, messages);
        courierOrderMessages.delete(orderId);
      }

      // Обновляем сообщение у курьера, который взял заказ
      try {
        await ctx.editMessageText(
          `✅ *Buyurtma olingan!*\n\n` +
          `Buyurtma #${orderId.slice(0, 8)} sizga tayinlandi.\n\n` +
          `Yetkazib berishni yakunlaganingizdan so'ng, buyurtma holatini yangilang.`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Error editing message:', error);
      }

      await ctx.answerCbQuery('✅ Buyurtma olingan!');
      return;
    }

    // Обработка активации/деактивации через callback (для обратной совместимости)
    if (action === 'toggle_active') {
      // Перенаправляем на текстовый обработчик
      await courierToggleActiveHandler(ctx);
      return;
    }

    await ctx.answerCbQuery('Noma\'lum amal');
  } catch (error: any) {
    console.error('Error in courier handler:', error);
    await ctx.answerCbQuery('Xatolik yuz berdi');
  }
}

