// ============================================
// Telegram Web App Utilities
// ============================================

/**
 * Проверка, открыт ли сайт в Telegram Web App
 */
export function isTelegramWebApp(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Telegram?.WebApp;
}

/**
 * Получить данные пользователя из Telegram Web App
 */
export function getTelegramWebAppUser(): {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
} | null {
  if (typeof window === 'undefined') return null;
  
  const webApp = (window as any).Telegram?.WebApp;
  if (!webApp) return null;
  
  const user = webApp.initDataUnsafe?.user;
  if (!user) return null;
  
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    language_code: user.language_code,
  };
}

/**
 * Инициализация Telegram Web App
 */
export function initTelegramWebApp(): void {
  if (typeof window === 'undefined') return;
  
  const webApp = (window as any).Telegram?.WebApp;
  if (!webApp) return;
  
  // Расширяем приложение на весь экран
  webApp.expand();
  
  // Включаем вибрацию при необходимости
  webApp.enableClosingConfirmation();
  
  // Настраиваем цвет темы
  webApp.setHeaderColor('#ffffff');
  webApp.setBackgroundColor('#f9fafb');
}

/**
 * Получить Telegram ID пользователя из Web App или localStorage
 */
export function getTelegramUserId(): string | null {
  // Сначала пытаемся получить из Telegram Web App
  const webAppUser = getTelegramWebAppUser();
  if (webAppUser?.id) {
    return webAppUser.id.toString();
  }
  
  // Если не в Web App, пытаемся получить из localStorage
  if (typeof window !== 'undefined') {
    return localStorage.getItem('telegram_id');
  }
  
  return null;
}

