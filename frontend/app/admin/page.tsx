// ============================================
// Admin Dashboard - Статистика
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { getStats } from '@/lib/api';

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
    async function fetchStats() {
      try {
        const statsData = await getStats();
        if (statsData) {
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
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
      value: `${stats.todayRevenue.toLocaleString()} сум`,
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

      {/* Recent Activity - можно добавить позже через API */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Последние действия</h2>
        <div className="text-center py-8 text-gray-500">
          Функция в разработке
        </div>
      </div>
    </div>
  );
}

