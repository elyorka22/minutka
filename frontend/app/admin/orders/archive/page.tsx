// ============================================
// Admin Orders Archive Page - Архив заказов
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/lib/types';
import { getOrders } from '@/lib/api';

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

export default function AdminOrdersArchivePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const result = await getOrders(undefined, true); // archived = true
        setOrders(result.data);
      } catch (error) {
        console.error('Error fetching archived orders:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Загрузка архива заказов...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">📦 Архив заказов</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500">Архив заказов пуст</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-semibold text-gray-900">
                      Заказ #{order.id.slice(0, 8)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status as OrderStatus]}`}>
                      {statusLabels[order.status as OrderStatus]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Заказ:</span> {order.order_text}
                  </p>
                  {order.address && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Адрес:</span> {order.address}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Создан: {new Date(order.created_at).toLocaleString('ru-RU')}
                    {order.archived_at && (
                      <> • Архивирован: {new Date(order.archived_at).toLocaleString('ru-RU')}</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

