// ============================================
// Admin Orders Page - Управление заказами
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/lib/types';
import { getOrders, updateOrderStatus, getOrderById } from '@/lib/api';
import { handleApiError } from '@/lib/errorHandler';
import { useToast } from '@/contexts/ToastContext';
import Pagination from '@/components/Pagination';

const statusLabels: Record<OrderStatus, string> = {
  pending: 'В ожидании',
  accepted: 'Принят',
  ready: 'Готов',
  assigned_to_courier: 'Передан курьеру',
  delivered: 'Доставлен',
  cancelled: 'Отменен',
};

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  assigned_to_courier: 'bg-purple-100 text-purple-800',
  delivered: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

// Функция для передачи заказа курьеру (меняет статус на assigned_to_courier)
// Статус останется assigned_to_courier до тех пор, пока курьер не возьмет заказ
async function assignOrderToCourier(orderId: string): Promise<void> {
  try {
    // Меняем статус на assigned_to_courier (это уведомит курьеров)
    // Статус изменится на delivered только когда курьер возьмет заказ
    await updateOrderStatus(orderId, 'assigned_to_courier');
  } catch (error) {
    console.error('Error assigning order to courier:', error);
    throw error;
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const pageSize = 20;
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const result = await getOrders(undefined, false, currentPage, pageSize);
        setOrders(result.data);
        setPagination(result.pagination);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [currentPage]);

  const handleAssignToCourier = async (orderId: string) => {
    try {
      // Передаем заказ курьеру (статус меняется на assigned_to_courier)
      await assignOrderToCourier(orderId);
      
      // Обновляем заказ в списке
      const updatedOrder = await getOrderById(orderId);
      setOrders(
        orders.map((order) =>
          order.id === orderId ? updatedOrder : order
        )
      );
      showSuccess('Заказ передан курьеру. Курьер получит уведомление и сможет взять заказ.');
    } catch (error) {
      console.error('Error assigning order to courier:', error);
      showError(handleApiError(error));
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
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => handleAssignToCourier(order.id)}
                        className="px-3 py-1 bg-purple-500 text-white rounded text-xs font-semibold hover:bg-purple-600 transition-colors shadow-sm"
                        title="Передать заказ курьеру"
                      >
                        🚚
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleString('ru-RU')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {order.status !== 'delivered' && order.status !== 'cancelled' ? (
                    <button
                      onClick={() => handleAssignToCourier(order.id)}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors text-sm shadow-md"
                    >
                      🚚 Передать курьеру
                    </button>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
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
            {order.status !== 'delivered' && order.status !== 'cancelled' && (
              <div className="pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleAssignToCourier(order.id)}
                  className="w-full px-4 py-2.5 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors text-sm shadow-md"
                >
                  🚚 Передать курьеру
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Заказов с выбранным статусом не найдено
        </div>
      )}

      {pagination && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
        />
      )}
    </div>
  );
}

