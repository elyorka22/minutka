// ============================================
// Restaurant Admin Panel Layout
// ============================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getMyRestaurants } from '@/lib/api';

const navigation = [
  { name: 'Дашборд', href: '/restaurant-admin', icon: '📊' },
  { name: 'Заказы', href: '/restaurant-admin/orders', icon: '📦' },
  { name: 'Архив заказов', href: '/restaurant-admin/orders/archive', icon: '📚' },
  { name: 'Меню', href: '/restaurant-admin/menu', icon: '🍽️' },
  { name: 'Повара', href: '/restaurant-admin/chefs', icon: '👨‍🍳' },
  { name: 'Ссылка для Telegram', href: '/restaurant-admin/telegram-link', icon: '🔗' },
  { name: 'Настройки', href: '/restaurant-admin/settings', icon: '⚙️' },
  { name: 'Изменить пароль', href: '/restaurant-admin/change-password', icon: '🔐' },
];

export default function RestaurantAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasMultipleRestaurants, setHasMultipleRestaurants] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'restaurant_admin') {
        // Редиректим в зависимости от роли
        if (user.role === 'super_admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        // Проверяем, выбран ли ресторан (кроме страницы выбора ресторана)
        if (pathname !== '/restaurant-admin/select-restaurant') {
          const selectedRestaurantId = localStorage.getItem('selected_restaurant_id');
          console.log('[Layout] Checking restaurant selection:', {
            pathname,
            selectedRestaurantId,
            user: user?.user
          });
          
          if (!selectedRestaurantId) {
            // Если ресторан не выбран, проверяем, есть ли у админа несколько ресторанов
            const telegramId = localStorage.getItem('telegram_id');
            const hasMultipleRestaurants = (user?.user as any)?.hasMultipleRestaurants;
            
            console.log('[Layout] No restaurant selected, checking if multiple restaurants:', {
              telegramId,
              hasMultipleRestaurants
            });
            
            if (telegramId) {
              // Редиректим на страницу выбора ресторана
              console.log('[Layout] Redirecting to select-restaurant page');
              router.push('/restaurant-admin/select-restaurant');
            }
          }
        }
      }
    }
  }, [user, loading, router, pathname]);

  // Проверяем, есть ли у админа несколько ресторанов
  useEffect(() => {
    const checkMultipleRestaurants = async () => {
      if (user && user.role === 'restaurant_admin' && pathname !== '/restaurant-admin/select-restaurant') {
        const telegramId = localStorage.getItem('telegram_id');
        if (telegramId) {
          try {
            const restaurants = await getMyRestaurants(telegramId);
            setHasMultipleRestaurants(restaurants.length > 1);
          } catch (error) {
            console.error('Error checking restaurants:', error);
          }
        }
      }
    };
    checkMultipleRestaurants();
  }, [user, pathname]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Загрузка...</div>;
  }

  if (!user || user.role !== 'restaurant_admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b relative z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                ☰
              </button>
              <Link href="/restaurant-admin" className="text-lg sm:text-xl font-bold text-gray-900">
                🍽️ Панель ресторана
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {hasMultipleRestaurants && (
                <button
                  onClick={() => router.push('/restaurant-admin/select-restaurant')}
                  className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
                >
                  Сменить ресторан
                </button>
              )}
              <button
                onClick={logout}
                className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium"
              >
                Выйти
              </button>
              <Link
                href="/"
                className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium"
              >
                На сайт
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed top-16 left-0 right-0 bottom-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Overlay */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white shadow-lg transition-transform duration-300 z-50 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 overflow-y-auto`}
      >
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}

