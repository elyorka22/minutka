// ============================================
// Courier Menu Keyboard - Меню для курьеров
// ============================================

import { Markup } from 'telegraf';
import { supabase } from '../config/supabase';

/**
 * Создает reply keyboard для курьеров
 * Включает все стандартные кнопки меню плюс кнопку активации/деактивации
 * @param isActive - текущий статус курьера (активен или нет)
 */
export async function createCourierMenuKeyboard(isActive: boolean) {
  try {
    // Получаем текст кнопок из БД
    const { data: settings } = await supabase
      .from('bot_settings')
      .select('key, value')
      .in('key', ['button_bot_info_text', 'button_partnership_text']);

    // Создаем объект для быстрого доступа
    const settingsMap: Record<string, string> = {};
    settings?.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    // Используем текст из БД или значения по умолчанию
    const botInfoText = settingsMap['button_bot_info_text'] || 'ℹ️ Bot haqida';
    const partnershipText = settingsMap['button_partnership_text'] || '🤝 Hamkorlik';
    const toggleButtonText = isActive ? '❌ O\'chirish' : '✅ Faollashtirish';

    return Markup.keyboard([
      [
        Markup.button.text(botInfoText),
        Markup.button.text(partnershipText)
      ],
      [
        Markup.button.text('🆔 Chat ID')
      ],
      [
        Markup.button.text(toggleButtonText)
      ]
    ]).resize().oneTime();
  } catch (error) {
    console.error('Error loading button texts from DB, using defaults:', error);
    // В случае ошибки используем значения по умолчанию
    const toggleButtonText = isActive ? '❌ O\'chirish' : '✅ Faollashtirish';
    return Markup.keyboard([
      [
        Markup.button.text('ℹ️ Bot haqida'),
        Markup.button.text('🤝 Hamkorlik')
      ],
      [
        Markup.button.text('🆔 Chat ID')
      ],
      [
        Markup.button.text(toggleButtonText)
      ]
    ]).resize().oneTime();
  }
}

