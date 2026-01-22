// ============================================
// Main Menu Keyboard - Главное меню бота
// ============================================

import { Markup } from 'telegraf';
import { supabase } from '../config/supabase';

/**
 * Создает reply keyboard с главными кнопками
 * Текст кнопок берется из БД (bot_settings)
 */
export async function createMainMenuKeyboard() {
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

    return Markup.keyboard([
      [
        Markup.button.text(botInfoText),
        Markup.button.text(partnershipText)
      ],
      [
        Markup.button.text('🆔 Chat ID')
      ]
    ]).resize().persistent();
  } catch (error) {
    console.error('Error loading button texts from DB, using defaults:', error);
    // В случае ошибки используем значения по умолчанию
    return Markup.keyboard([
      [
        Markup.button.text('ℹ️ Bot haqida'),
        Markup.button.text('🤝 Hamkorlik')
      ],
      [
        Markup.button.text('🆔 Chat ID')
      ]
    ]).resize().persistent();
  }
}

