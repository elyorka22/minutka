// ============================================
// Telegram Web App Initialization Component
// ============================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initTelegramWebApp, getTelegramWebAppUser, getTelegramUserId } from '@/lib/telegram-webapp';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function TelegramWebAppInit() {
  const router = useRouter();

  useEffect(() => {
    // Инициализируем Telegram Web App
    initTelegramWebApp();
    
    // Получаем данные пользователя из Telegram Web App
    const webAppUser = getTelegramWebAppUser();
    let telegramId: string | null = null;
    
    if (webAppUser) {
      // Сохраняем telegram_id в localStorage для использования в приложении
      telegramId = webAppUser.id.toString();
      if (!localStorage.getItem('telegram_id')) {
        localStorage.setItem('telegram_id', telegramId);
        console.log('[TelegramWebApp] Detected user from Telegram Web App:', telegramId);
      }
    } else {
      // Если не в Telegram Web App, пытаемся получить из localStorage
      telegramId = getTelegramUserId();
      if (telegramId) {
        console.log('[TelegramWebApp] Using telegram_id from localStorage:', telegramId);
      }
    }

    // Если есть telegram_id, проверяем роль и автоматически редиректим
    if (telegramId) {
      checkUserRoleAndRedirect(telegramId);
    }
  }, [router]);

  const checkUserRoleAndRedirect = async (telegramId: string) => {
    try {
      // Проверяем роль пользователя через API (без пароля, только для проверки)
      const response = await fetch(`${API_BASE_URL}/api/auth/me?telegram_id=${telegramId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        const role = data.data.role;
        console.log('[TelegramWebApp] User role detected:', role);

        // Автоматически редиректим в зависимости от роли
        if (role === 'super_admin') {
          console.log('[TelegramWebApp] Redirecting super_admin to /admin');
          router.push('/admin');
        } else if (role === 'restaurant_admin') {
          console.log('[TelegramWebApp] Redirecting restaurant_admin to /restaurant-admin');
          // Проверяем, есть ли у админа несколько ресторанов
          if (data.data.user?.hasMultipleRestaurants) {
            router.push('/restaurant-admin/select-restaurant');
          } else {
            // Сохраняем restaurant_id для админа с одним рестораном
            if (data.data.user?.restaurant_id) {
              localStorage.setItem('selected_restaurant_id', data.data.user.restaurant_id);
            }
            router.push('/restaurant-admin');
          }
        } else if (role === 'user') {
          // Клиент - не редиректим, остаемся на главной странице
          console.log('[TelegramWebApp] User is a client, staying on homepage');
        }
      } else {
        // Пользователь не найден или требуется пароль (сотрудник)
        console.log('[TelegramWebApp] User not found or requires password');
      }
    } catch (error) {
      console.error('[TelegramWebApp] Error checking user role:', error);
      // Не показываем ошибку пользователю, просто логируем
    }
  };

  return null; // Компонент не рендерит ничего
}

