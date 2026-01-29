// ============================================
// Restaurant Admin Dashboard
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { getRestaurantStats, getOrders } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurantId } from '@/hooks/useRestaurantId';
import { Order } from '@/lib/types';

interface RestaurantStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

const statusLabels: Record<string, string> = {
  pending: 'В ожидании',
  accepted: 'Принят',
  ready: 'Готов',
  delivered: 'Доставлен',
  cancelled: 'Отменен',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function RestaurantAdminDashboard() {
  const { user } = useAuth();
  const currentRestaurantId = useRestaurantId();
  const [stats, setStats] = useState<RestaurantStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!currentRestaurantId) {
        setLoading(false);
        return;
      }

      try {
        const [statsData, ordersData] = await Promise.all([
          getRestaurantStats(currentRestaurantId),
          getOrders(currentRestaurantId).then(result => result.data)
        ]);

        if (statsData) {
          setStats(statsData);
        }

        // Берем последние 5 заказов
        if (ordersData && Array.isArray(ordersData)) {
          setRecentOrders(ordersData.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentRestaurantId]);

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
      value: `${stats.todayRevenue.toLocaleString()} so'm`,
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
      value: `${stats.totalRevenue.toLocaleString()} so'm`,
      subtitle: 'за все время',
      color: 'bg-indigo-500',
    },
    {
      title: 'Средний чек',
      value: `${stats.averageOrderValue} so'm`,
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
        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Заказов пока нет
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const orderDate = new Date(order.created_at);
              const now = new Date();
              const diffMs = now.getTime() - orderDate.getTime();
              const diffMins = Math.floor(diffMs / 60000);
              const diffHours = Math.floor(diffMins / 60);
              const diffDays = Math.floor(diffHours / 24);

              let timeAgo = '';
              if (diffMins < 1) {
                timeAgo = 'только что';
              } else if (diffMins < 60) {
                timeAgo = `${diffMins} ${diffMins === 1 ? 'минуту' : diffMins < 5 ? 'минуты' : 'минут'} назад`;
              } else if (diffHours < 24) {
                timeAgo = `${diffHours} ${diffHours === 1 ? 'час' : diffHours < 5 ? 'часа' : 'часов'} назад`;
              } else {
                timeAgo = `${diffDays} ${diffDays === 1 ? 'день' : 'дня'} назад`;
              }

              return (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      Заказ #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-gray-600">{order.order_text || 'Без описания'}</p>
                    {order.address && (
                      <p className="text-xs text-gray-500 mt-1">📍 {order.address}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${
                      statusColors[order.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

