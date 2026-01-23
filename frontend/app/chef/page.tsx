// ============================================
// Chef Dashboard - Заказы для повара
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getOrders } from '@/lib/api';
import { Order } from '@/lib/types';

const statusLabels: Record<string, string> = {
  pending: '⏳ Ожидает',
  accepted: '✅ Принят',
  ready: '🚀 Готов',
  delivered: '✅ Доставлен',
  cancelled: '❌ Отменен',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function ChefDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (!user || user.role !== 'chef' || !user.user) {
        setLoading(false);
        return;
      }

      // Получаем restaurant_id из данных повара
      const restaurantId = (user.user as any).restaurant_id;
      if (!restaurantId) {
        setLoading(false);
        return;
      }

      try {
        const ordersData = await getOrders(restaurantId);
        // Фильтруем только заказы в статусе pending, accepted, ready
        const filteredOrders = ordersData.filter(
          (order) => ['pending', 'accepted', 'ready'].includes(order.status)
        );
        setOrders(filteredOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [user]);

  if (loading) {
    return <div className="text-center py-12">Загрузка заказов...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">📦 Заказы</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 text-lg">Нет активных заказов</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Заказ #{order.id.slice(0, 8)}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(order.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    statusColors[order.status] || statusColors.pending
                  }`}
                >
                  {statusLabels[order.status] || order.status}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Заказ:</p>
                  <p className="text-gray-900">{order.order_text}</p>
                </div>
                {order.address && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Адрес:</p>
                    <p className="text-gray-900">{order.address}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

