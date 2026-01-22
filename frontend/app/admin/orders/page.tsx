// ============================================
// Admin Orders Page - Управление заказами
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/lib/types';

// Демо данные заказов
const demoOrders: Order[] = [
  {
    id: '1',
    restaurant_id: '2',
    user_id: '1',
    order_text: 'Филадельфия x2, Калифорния x1',
    address: 'ул. Ленина, д. 10, кв. 5',
    latitude: null,
    longitude: null,
    status: 'pending',
    telegram_message_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    restaurant_id: '1',
    user_id: '2',
    order_text: 'Пицца Маргарита x1, Пепперони x1',
    address: 'ул. Мира, д. 25, кв. 12',
    latitude: null,
    longitude: null,
    status: 'accepted',
    telegram_message_id: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: '3',
    restaurant_id: '2',
    user_id: '3',
    order_text: 'Сет "Самурай" x1',
    address: 'ул. Пушкина, д. 7',
    latitude: null,
    longitude: null,
    status: 'ready',
    telegram_message_id: null,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 600000).toISOString(),
  },
];

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    setOrders(demoOrders);
    setLoading(false);
  }, []);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus, updated_at: new Date().toISOString() } : order
      )
    );
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📦 Управление заказами</h1>
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

      {/* Orders Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Заказ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Адрес
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата создания
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{order.id}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{order.order_text}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">{order.address || '—'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleString('ru-RU')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Orders Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Заказ #{order.id}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{order.order_text}</p>
                {order.address && (
                  <p className="text-sm text-gray-600 mb-1">📍 {order.address}</p>
                )}
                <p className="text-xs text-gray-500">
                  {new Date(order.created_at).toLocaleString('ru-RU')}
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Заказов с выбранным статусом не найдено
        </div>
      )}
    </div>
  );
}

