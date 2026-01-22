// ============================================
// Keyboard for Order Actions (Restaurant)
// ============================================

import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';

/**
 * Создает inline клавиатуру с действиями для заказа
 */
export function createOrderActionKeyboard(orderId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '✅ Qabul qilish', callback_data: `order:accept:${orderId}` },
        { text: '❌ Rad etish', callback_data: `order:cancel:${orderId}` }
      ],
      [
        { text: '🚀 Tayyor', callback_data: `order:ready:${orderId}` }
      ]
    ]
  };
}

