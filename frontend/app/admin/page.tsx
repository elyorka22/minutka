// ============================================
// Admin Dashboard - Статистика
// ============================================

'use client';

import { useEffect, useState } from 'react';

interface Stats {
  totalRestaurants: number;
  activeRestaurants: number;
  totalOrders: number;
  pendingOrders: number;
  totalUsers: number;
  totalBanners: number;
  todayOrders: number;
  todayRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // В MVP используем демо данные
    // В реальности здесь будет запрос к API
    setTimeout(() => {
      setStats({
        totalRestaurants: 6,
        activeRestaurants: 6,
        totalOrders: 124,
        pendingOrders: 8,
        totalUsers: 89,
        totalBanners: 4,
        todayOrders: 12,
        todayRevenue: 15600,
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return <div className="text-center py-12">Загрузка статистики...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12">Ошибка загрузки данных</div>;
  }

  const statCards = [
    {
      title: 'Всего ресторанов',
      value: stats.totalRestaurants,
      subtitle: `${stats.activeRestaurants} активных`,
      color: 'bg-blue-500',
    },
    {
      title: 'Всего заказов',
      value: stats.totalOrders,
      subtitle: `${stats.pendingOrders} в ожидании`,
      color: 'bg-green-500',
    },
    {
      title: 'Пользователи',
      value: stats.totalUsers,
      subtitle: 'зарегистрировано',
      color: 'bg-purple-500',
    },
    {
      title: 'Баннеры',
      value: stats.totalBanners,
      subtitle: 'активных',
      color: 'bg-yellow-500',
    },
    {
      title: 'Заказы сегодня',
      value: stats.todayOrders,
      subtitle: 'новых заказов',
      color: 'bg-indigo-500',
    },
    {
      title: 'Выручка сегодня',
      value: `${stats.todayRevenue.toLocaleString()}₽`,
      subtitle: 'за сегодня',
      color: 'bg-emerald-500',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">📊 Дашборд</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div>
              <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Последние действия</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-2xl">📦</span>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Новый заказ #123</p>
              <p className="text-sm text-gray-600">Ресторан: Суши Мастер • 5 минут назад</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-2xl">🍽️</span>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Ресторан активирован</p>
              <p className="text-sm text-gray-600">Пиццерия Италия • 1 час назад</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-2xl">👤</span>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Новый пользователь</p>
              <p className="text-sm text-gray-600">Зарегистрирован через Telegram • 2 часа назад</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

