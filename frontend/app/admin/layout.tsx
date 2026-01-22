// ============================================
// Admin Panel Layout
// ============================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Статистика', href: '/admin', icon: '📊' },
  { name: 'Рестораны', href: '/admin/restaurants', icon: '🍽️' },
  { name: 'Заказы', href: '/admin/orders', icon: '📦' },
  { name: 'Пользователи', href: '/admin/users', icon: '👥' },
  { name: 'Баннеры', href: '/admin/banners', icon: '🖼️' },
  { name: 'Категории', href: '/admin/categories', icon: '🏷️' },
  { name: 'Повара', href: '/admin/chefs', icon: '👨‍🍳' },
  { name: 'Настройки бота', href: '/admin/bot-settings', icon: '🤖' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                ☰
              </button>
              <Link href="/admin" className="text-lg sm:text-xl font-bold text-gray-900">
                🛡️ Супер-админ панель
              </Link>
            </div>
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              ← На сайт
            </Link>
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

