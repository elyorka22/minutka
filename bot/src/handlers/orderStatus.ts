// ============================================
// Order Status Handler - Обработка действий ресторана
// ============================================

import { Context } from 'telegraf';
import { supabase } from '../config/supabase';
import { apiRequest } from '../config/api';
import { notifyRestaurantAdminsAboutReadyOrder } from '../services/adminNotification';

/**
 * Обработчик действий повара (chef) и админа ресторана с заказом
 * @param ctx - контекст Telegram
 * @param orderId - ID заказа
 * @param action - действие: delete (повар нажал "Tayyor"), delivered (админ нажал "Доставлен")
 */
export async function orderStatusHandler(
  ctx: Context,
  orderId: string,
  action: string
) {
  try {
    // Повар нажал "Tayyor" - удаляем сообщение и уведомляем админов ресторана
    if (action === 'delete') {
      await ctx.answerCbQuery('✅ Buyurtma tayyor!');
      
      // Получаем информацию о заказе для уведомления админов
      try {
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('restaurant_id, order_text, address, user_id')
          .eq('id', orderId)
          .single();

        if (orderError || !order) {
          console.error('Error fetching order:', orderError);
        } else {
          // Получаем информацию о пользователе
          let userName = 'Foydalanuvchi';
          if (order.user_id) {
            const { data: user } = await supabase
              .from('users')
              .select('username, first_name')
              .eq('id', order.user_id)
              .single();
            
            if (user) {
              userName = user.username ? `@${user.username}` : (user.first_name || 'Foydalanuvchi');
            }
          }

          // Уведомляем админов ресторана о готовом заказе
          await notifyRestaurantAdminsAboutReadyOrder(
            order.restaurant_id,
            orderId,
            {
              orderText: order.order_text,
              address: order.address,
              userName
            }
          );
        }
      } catch (error) {
        console.error('Error notifying restaurant admins:', error);
      }

      // Удаляем сообщение с заказом у повара
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error('Error deleting message:', error);
        // Если не удалось удалить, просто обновляем сообщение
        await ctx.editMessageText(
          `✅ *Buyurtma tayyor!*\n\n` +
          `Buyurtma #${orderId.slice(0, 8)} tayyor.`,
          { parse_mode: 'Markdown' }
        );
      }
      return;
    }

    // Админ ресторана нажал "Доставлен" - меняем статус заказа
    if (action === 'delivered') {
      await ctx.answerCbQuery('✅ Buyurtma yetkazildi deb belgilandi');

      // Проверяем, что пользователь является админом ресторана
      const telegramId = ctx.from?.id;
      if (!telegramId) {
        await ctx.answerCbQuery('❌ Foydalanuvchi aniqlanmadi');
        return;
      }

      try {
        // Получаем информацию о заказе
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('restaurant_id')
          .eq('id', orderId)
          .single();

        if (orderError || !order) {
          await ctx.answerCbQuery('❌ Buyurtma topilmadi');
          return;
        }

        // Проверяем, что пользователь является админом этого ресторана
        const { data: admin, error: adminError } = await supabase
          .from('restaurant_admins')
          .select('id')
          .eq('restaurant_id', order.restaurant_id)
          .eq('telegram_id', telegramId)
          .eq('is_active', true)
          .single();

        if (adminError || !admin) {
          await ctx.answerCbQuery('❌ Sizda bu buyurtmani boshqarish huquqi yo\'q');
          return;
        }

        // Обновляем статус заказа через API
        await apiRequest(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'delivered',
            changed_by: 'restaurant_admin',
            telegram_id: telegramId
          })
        });

        // Обновляем сообщение
        try {
          await ctx.editMessageText(
            `✅ *Buyurtma yetkazildi*\n\n` +
            `Buyurtma #${orderId.slice(0, 8)} yetkazildi deb belgilandi.`,
            { parse_mode: 'Markdown' }
          );
        } catch (error) {
          console.error('Error editing message:', error);
        }
      } catch (error: any) {
        console.error('Error updating order status:', error);
        await ctx.answerCbQuery('❌ Xatolik yuz berdi');
      }
      return;
    }

    // Для обратной совместимости с другими действиями (если есть)
    await ctx.answerCbQuery('Noma\'lum amal');
  } catch (error: any) {
    console.error('Error in order status handler:', error);
    await ctx.answerCbQuery('Xatolik yuz berdi');
  }
}


