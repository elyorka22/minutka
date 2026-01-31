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
    const chatId = ctx.chat?.id;
    
    if (!telegramId) {
      await ctx.reply('❌ Foydalanuvchi aniqlanmadi');
      return;
    }

    // Проверяем, что пользователь является курьером
    const { data: courier, error: courierError } = await supabase
      .from('couriers')
      .select('id, telegram_id, telegram_chat_id, is_active')
      .eq('telegram_id', telegramId)
      .single();

    if (courierError || !courier) {
      await ctx.reply('❌ Siz kuryer emassiz');
      return;
    }

    // Обновляем telegram_chat_id, если его нет или он изменился
    const updateData: any = {};
    if (chatId && courier.telegram_chat_id !== chatId) {
      updateData.telegram_chat_id = chatId;
      console.log(`[Courier] Updating telegram_chat_id for courier ${telegramId}: ${chatId}`);
    }

    // Переключаем статус
    const newStatus = !courier.is_active;
    updateData.is_active = newStatus;
    
    const { error: updateError } = await supabase
      .from('couriers')
      .update(updateData)
      .eq('id', courier.id);

    if (updateError) {
      console.error('Error updating courier status:', updateError);
      await ctx.reply('❌ Xatolik yuz berdi');
      return;
    }

    const statusText = newStatus ? '✅ Faollashtirildi' : '❌ O\'chirildi';
    const keyboard = await createCourierMenuKeyboard(newStatus);
    
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
      const chatId = ctx.chat?.id;
      
      // Проверяем, что пользователь является активным курьером
      const { data: courier, error: courierError } = await supabase
        .from('couriers')
        .select('id, telegram_id, telegram_chat_id, is_active')
        .eq('telegram_id', telegramId)
        .eq('is_active', true)
        .single();

      // Обновляем telegram_chat_id, если его нет или он изменился
      if (chatId && courier && courier.telegram_chat_id !== chatId) {
        await supabase
          .from('couriers')
          .update({ telegram_chat_id: chatId })
          .eq('id', courier.id);
        console.log(`[Courier] Updating telegram_chat_id for courier ${telegramId}: ${chatId}`);
      }

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

      // Получаем полную информацию о заказе для отображения курьеру
      const { data: orderDetails, error: orderDetailsError } = await supabase
        .from('orders')
        .select(`
          id,
          order_text,
          address,
          restaurant_id,
          user_id,
          restaurants(name),
          users(phone)
        `)
        .eq('id', orderId)
        .single();

      if (orderDetailsError || !orderDetails) {
        console.error('Error fetching order details:', orderDetailsError);
        await ctx.answerCbQuery('❌ Buyurtma ma\'lumotlari topilmadi');
        return;
      }

      // Обновляем заказ - назначаем курьера (статус остается assigned_to_courier)
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          courier_id: courier.id
        })
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

      // Формируем сообщение с данными заказа для курьера
      const restaurant = orderDetails.restaurants as any;
      const user = orderDetails.users as any;
      const userPhone = user?.phone || 'Ko\'rsatilmagan';
      const address = orderDetails.address || 'Ko\'rsatilmagan';
      
      // Парсим общую сумму из order_text
      const totalMatch = orderDetails.order_text.match(/Jami:\s*(\d+)/i) || 
                        orderDetails.order_text.match(/Total:\s*(\d+)/i) ||
                        orderDetails.order_text.match(/💰\s*(\d+)/i);
      const total = totalMatch ? `${totalMatch[1]} so'm` : 'Ko\'rsatilmagan';

      const courierMessage = `✅ *Buyurtma olingan!*\n\n` +
        `🆔 Buyurtma: #${orderId.slice(0, 8)}\n` +
        `🍽️ Restoran: ${restaurant?.name || 'Restoran'}\n` +
        `💰 Narx: ${total}\n` +
        `📍 Manzil: ${address}\n` +
        `📝 Buyurtma: ${orderDetails.order_text}\n` +
        `📞 Mijoz: \`${userPhone}\`\n\n` +
        `Yetkazib berishni yakunlaganingizdan so'ng, "Yetkazildi" tugmasini bosing.`;

      // Создаем клавиатуру с кнопкой "Доставлен"
      const deliveredKeyboard = {
        inline_keyboard: [
          [
            { text: '✅ Yetkazildi', callback_data: `courier:delivered:${orderId}` }
          ]
        ]
      };

      // Обновляем сообщение у курьера, который взял заказ
      try {
        await ctx.editMessageText(
          courierMessage,
          {
            parse_mode: 'Markdown',
            reply_markup: deliveredKeyboard
          }
        );
      } catch (error) {
        console.error('Error editing message:', error);
      }

      await ctx.answerCbQuery('✅ Buyurtma olingan!');
      return;
    }

    // Курьер нажал "Доставлен"
    if (action === 'delivered') {
      // Проверяем, что пользователь является курьером и взял этот заказ
      const { data: courier, error: courierError } = await supabase
        .from('couriers')
        .select('id, telegram_id')
        .eq('telegram_id', telegramId)
        .single();

      if (courierError || !courier) {
        await ctx.answerCbQuery('❌ Siz kuryer emassiz');
        return;
      }

      // Проверяем заказ
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, courier_id, status')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        await ctx.answerCbQuery('❌ Buyurtma topilmadi');
        return;
      }

      if (order.courier_id !== courier.id) {
        await ctx.answerCbQuery('❌ Bu buyurtma sizga tegishli emas');
        return;
      }

      // Обновляем статус заказа на delivered через API
      try {
        await apiRequest(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: {
            'x-telegram-id': String(telegramId)
          },
          body: JSON.stringify({
            status: 'delivered',
            changed_by: 'courier',
            telegram_id: telegramId
          })
        });

        // Обновляем сообщение
        await ctx.editMessageText(
          `✅ *Buyurtma yetkazildi!*\n\n` +
          `Buyurtma #${orderId.slice(0, 8)} muvaffaqiyatli yetkazildi.`,
          { parse_mode: 'Markdown' }
        );

        await ctx.answerCbQuery('✅ Buyurtma yetkazildi!');
      } catch (error: any) {
        console.error('Error updating order status to delivered:', error);
        await ctx.answerCbQuery('❌ Xatolik yuz berdi');
      }
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

