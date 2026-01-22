// ============================================
// Restaurant Admin Dashboard
// ============================================

'use client';

import { useState, useEffect } from 'react';

interface RestaurantStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export default function RestaurantAdminDashboard() {
  const [stats, setStats] = useState<RestaurantStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // В MVP используем демо данные
    setTimeout(() => {
      setStats({
        todayOrders: 12,
        todayRevenue: 15600,
        pendingOrders: 3,
        totalOrders: 89,
        totalRevenue: 124500,
        averageOrderValue: 1400,
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
      title: 'Заказы сегодня',
      value: stats.todayOrders,
      subtitle: 'новых заказов',
      color: 'bg-blue-500',
    },
    {
      title: 'Выручка сегодня',
      value: `${stats.todayRevenue.toLocaleString()}₽`,
      subtitle: 'за сегодня',
      color: 'bg-green-500',
    },
    {
      title: 'В ожидании',
      value: stats.pendingOrders,
      subtitle: 'заказов',
      color: 'bg-yellow-500',
    },
    {
      title: 'Всего заказов',
      value: stats.totalOrders,
      subtitle: 'за все время',
      color: 'bg-purple-500',
    },
    {
      title: 'Общая выручка',
      value: `${stats.totalRevenue.toLocaleString()}₽`,
      subtitle: 'за все время',
      color: 'bg-indigo-500',
    },
    {
      title: 'Средний чек',
      value: `${stats.averageOrderValue}₽`,
      subtitle: 'на заказ',
      color: 'bg-emerald-500',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">📊 Дашборд ресторана</h1>

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

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Последние заказы</h2>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-gray-900">Заказ #123</p>
              <p className="text-sm text-gray-600">Филадельфия x2, Калифорния x1</p>
              <p className="text-xs text-gray-500 mt-1">5 минут назад</p>
            </div>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold w-fit">
              В ожидании
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-gray-900">Заказ #122</p>
              <p className="text-sm text-gray-600">Сет "Самурай" x1</p>
              <p className="text-xs text-gray-500 mt-1">15 минут назад</p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold w-fit">
              Принят
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-gray-900">Заказ #121</p>
              <p className="text-sm text-gray-600">Нигири с лососем x3</p>
              <p className="text-xs text-gray-500 mt-1">1 час назад</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold w-fit">
              Готов
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

