// ============================================
// Courier Menu Keyboard - Меню для курьеров
// ============================================

import { Markup } from 'telegraf';

/**
 * Создает reply keyboard для курьеров
 * @param isActive - текущий статус курьера (активен или нет)
 */
export function createCourierMenuKeyboard(isActive: boolean) {
  const toggleButtonText = isActive ? '❌ O\'chirish' : '✅ Faollashtirish';
  
  return Markup.keyboard([
    [
      Markup.button.text(toggleButtonText)
    ]
  ]).resize().persistent();
}

