// ============================================
// Admin Panel Layout
// ============================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Статистика', href: '/admin', icon: '📊' },
  { name: 'Рестораны', href: '/admin/restaurants', icon: '🍽️' },
  { name: 'Заказы', href: '/admin/orders', icon: '📦' },
  { name: 'Архив заказов', href: '/admin/orders/archive', icon: '📚' },
  { name: 'Пользователи', href: '/admin/users', icon: '👥' },
  { name: 'Баннеры', href: '/admin/banners', icon: '🖼️' },
  { name: 'Категории', href: '/admin/categories', icon: '🏷️' },
  { name: 'Повара', href: '/admin/chefs', icon: '👨‍🍳' },
  { name: 'Супер-админы', href: '/admin/super-admins', icon: '🛡️' },
  { name: 'Настройки бота', href: '/admin/bot-settings', icon: '🤖' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'super_admin') {
        // Редиректим в зависимости от роли
        if (user.role === 'chef') {
          router.push('/chef');
        } else if (user.role === 'restaurant_admin') {
          router.push('/restaurant-admin');
        } else {
          router.push('/');
        }
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Загрузка...</div>;
  }

  if (!user || user.role !== 'super_admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center min-w-0 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-gray-700 mr-2 sm:mr-4 flex-shrink-0"
              >
                ☰
              </button>
              <Link href="/admin" className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 truncate">
                🛡️ Супер-админ панель
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <button
                onClick={logout}
                className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium"
              >
                Выйти
              </button>
              <Link
                href="/"
                className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium hidden sm:inline"
              >
                ← На сайт
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`bg-white shadow-sm transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-0'
          } overflow-hidden`}
        >
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

