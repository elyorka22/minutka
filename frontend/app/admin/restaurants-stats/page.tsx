// ============================================
// Admin Restaurants Statistics Page
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { getRestaurantsStats } from '@/lib/api';

interface RestaurantStat {
  restaurant_id: string;
  restaurant_name: string;
  is_active: boolean;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
}

export default function AdminRestaurantsStatsPage() {
  const [stats, setStats] = useState<RestaurantStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const data = await getRestaurantsStats();
        setStats(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching restaurants stats:', err);
        setError(err.message || 'Ошибка загрузки статистики');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Получаем текущий месяц и год
  const now = new Date();
  const monthNames = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ];
  const currentMonth = monthNames[now.getMonth()];
  const currentYear = now.getFullYear();

  // Общая статистика
  const totalOrders = stats.reduce((sum, stat) => sum + stat.total_orders, 0);
  const totalRevenue = stats.reduce((sum, stat) => sum + stat.total_revenue, 0);
  const overallAverage = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <p className="mt-4 text-gray-600">Загрузка статистики...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-red-800">❌ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          📈 Статистика по ресторанам
        </h1>
        <p className="text-gray-600">
          За период: <span className="font-semibold">{currentMonth} {currentYear}</span>
        </p>
      </div>

      {/* Общая статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600 mb-1">Всего заказов</p>
          <p className="text-3xl font-bold text-gray-900">{totalOrders.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600 mb-1">Общая выручка</p>
          <p className="text-3xl font-bold text-gray-900">{totalRevenue.toLocaleString()} so'm</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600 mb-1">Средний чек</p>
          <p className="text-3xl font-bold text-gray-900">{overallAverage.toLocaleString()} so'm</p>
        </div>
      </div>

      {/* Таблица статистики по ресторанам */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ресторан
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Заказов
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Выручка
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Средний чек
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Нет данных за текущий месяц
                  </td>
                </tr>
              ) : (
                stats.map((stat) => (
                  <tr key={stat.restaurant_id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {stat.restaurant_name}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          stat.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {stat.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {stat.total_orders.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                      {stat.total_revenue.toLocaleString()} so'm
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {stat.average_order_value.toLocaleString()} so'm
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Мобильная версия - карточки */}
      <div className="mt-6 sm:hidden space-y-4">
        {stats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Нет данных за текущий месяц
          </div>
        ) : (
          stats.map((stat) => (
            <div key={stat.restaurant_id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {stat.restaurant_name}
                </h3>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    stat.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {stat.is_active ? 'Активен' : 'Неактивен'}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Заказов:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {stat.total_orders.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Выручка:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {stat.total_revenue.toLocaleString()} so'm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Средний чек:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {stat.average_order_value.toLocaleString()} so'm
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

