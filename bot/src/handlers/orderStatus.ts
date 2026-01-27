// ============================================
// Order Status Handler - Обработка действий ресторана
// ============================================

import { Context } from 'telegraf';

/**
 * Обработчик действий повара (chef) с заказом
 * Повары могут только удалять сообщения с заказами (не изменяя статус)
 * @param ctx - контекст Telegram
 * @param orderId - ID заказа
 * @param action - действие: delete (просто удаляет сообщение)
 */
export async function orderStatusHandler(
  ctx: Context,
  orderId: string,
  action: string
) {
  try {
    // Просто удаляем сообщение, не изменяя статус заказа
    if (action === 'delete') {
      await ctx.answerCbQuery('✅ Buyurtma olib tashlandi');
      
      // Удаляем сообщение с заказом, чтобы не перемешивались все заказы
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.error('Error deleting message:', error);
        // Если не удалось удалить, просто обновляем сообщение
        await ctx.editMessageText(
          `✅ *Buyurtma olib tashlandi*\n\n` +
          `Buyurtma #${orderId.slice(0, 8)} olib tashlandi.`,
          { parse_mode: 'Markdown' }
        );
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


