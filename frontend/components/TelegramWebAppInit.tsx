// ============================================
// Telegram Web App Initialization Component
// ============================================

'use client';

import { useEffect } from 'react';
import { initTelegramWebApp, getTelegramWebAppUser, getTelegramUserId } from '@/lib/telegram-webapp';

export default function TelegramWebAppInit() {
  useEffect(() => {
    // Инициализируем Telegram Web App
    initTelegramWebApp();
    
    // Получаем данные пользователя из Telegram Web App
    const webAppUser = getTelegramWebAppUser();
    
    if (webAppUser) {
      // Сохраняем telegram_id в localStorage для использования в приложении
      const telegramId = webAppUser.id.toString();
      localStorage.setItem('telegram_id', telegramId);
      console.log('[TelegramWebApp] Detected user from Telegram Web App:', telegramId);
    } else {
      // Если не в Telegram Web App, пытаемся получить из localStorage
      const telegramId = getTelegramUserId();
      if (telegramId) {
        console.log('[TelegramWebApp] Using telegram_id from localStorage:', telegramId);
      }
    }
  }, []);

  return null; // Компонент не рендерит ничего
}

