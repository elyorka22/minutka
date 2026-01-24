// ============================================
// Restaurant Admin Orders Page - Управление заказами ресторана
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/lib/types';
import { getOrders } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const statusLabels: Record<OrderStatus, string> = {
  pending: 'В ожидании',
  accepted: 'Принят',
  ready: 'Готов',
  delivered: 'Доставлен',
  cancelled: 'Отменен',
};

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function RestaurantAdminOrdersPage() {
  const { user } = useAuth();
  // Получаем restaurant_id из данных пользователя
  const currentRestaurantId = (user?.user as any)?.restaurant_id;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    async function fetchOrders() {
      if (!currentRestaurantId) {
        setLoading(false);
        return;
      }
      try {
        const data = await getOrders(currentRestaurantId);
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [currentRestaurantId]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // TODO: Вызвать API для обновления статуса
      // await updateOrderStatus(orderId, newStatus);
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus, updated_at: new Date().toISOString() } : order
        )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter((order) => order.status === statusFilter);

  if (loading) {
    return <div className="text-center py-12">Загрузка заказов...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📦 Заказы ресторана</h1>
        <div className="w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
          >
            <option value="all">Все статусы</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Заказ #{order.id}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-gray-700 mb-2">{order.order_text}</p>
                {order.address && (
                  <p className="text-sm text-gray-600 mb-1">📍 {order.address}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Создан: {new Date(order.created_at).toLocaleString('ru-RU')}
                </p>
              </div>
              <div className="w-full sm:w-auto sm:ml-4">
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-md">
          Заказов с выбранным статусом не найдено
        </div>
      )}
    </div>
  );
}

