// ============================================
// Restaurant Admin Orders Page - Управление заказами ресторана
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/lib/types';
import { getOrders, updateOrderStatus } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { handleApiError } from '@/lib/errorHandler';
import { useToast } from '@/contexts/ToastContext';
import Pagination from '@/components/Pagination';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const pageSize = 20;
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    async function fetchOrders() {
      if (!currentRestaurantId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const result = await getOrders(currentRestaurantId, false, currentPage, pageSize);
        setOrders(result.data);
        setPagination(result.pagination);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [currentRestaurantId, currentPage]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updatedOrder = await updateOrderStatus(orderId, newStatus);
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus, updated_at: updatedOrder.updated_at } : order
        )
      );
      showSuccess('Статус заказа успешно обновлен');
    } catch (error) {
      console.error('Error updating order status:', error);
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
        {filteredOrders.map((order) => {
          // Парсим order_text для извлечения структурированной информации
          const parseOrderText = (text: string) => {
            const lines = text.split('\n').filter(line => line.trim());
            const result: {
              items?: string[];
              total?: string;
              name?: string;
              phone?: string;
              address?: string;
              notes?: string;
            } = {};
            
            lines.forEach(line => {
              if (line.includes('Jami:') || line.includes('💰')) {
                result.total = line.replace(/💰|Jami:/g, '').trim();
              } else if (line.includes('Ism:') || line.includes('👤')) {
                result.name = line.replace(/👤|Ism:/g, '').trim();
              } else if (line.includes('Telefon:') || line.includes('📞')) {
                result.phone = line.replace(/📞|Telefon:/g, '').trim();
              } else if (line.includes('Manzil:') || line.includes('📍')) {
                result.address = line.replace(/📍|Manzil:/g, '').trim();
              } else if (line.includes('Izoh:') || line.includes('📝')) {
                result.notes = line.replace(/📝|Izoh:/g, '').trim();
              } else if (!line.includes('restoranidan buyurtma') && line.trim() && !result.items) {
                // Первые строки - это обычно товары
                if (!result.items) result.items = [];
                if (!line.includes('Jami:') && !line.includes('Ism:') && !line.includes('Telefon:') && !line.includes('Manzil:') && !line.includes('Izoh:')) {
                  result.items.push(line.trim());
                }
              }
            });
            
            return result;
          };

          const parsed = parseOrderText(order.order_text);
          
          return (
            <div key={order.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex-1 space-y-3">
                  {/* Заголовок заказа и статус */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">Заказ #{order.id.slice(0, 8)}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </div>

                  {/* Содержимое заказа (товары) */}
                  {parsed.items && parsed.items.length > 0 && (
                    <div className="space-y-1">
                      {parsed.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-gray-700">{item}</p>
                      ))}
                    </div>
                  )}

                  {/* Итого */}
                  {parsed.total && (
                    <p className="text-base font-semibold text-primary-600">
                      💰 {parsed.total}
                    </p>
                  )}

                  {/* Имя клиента */}
                  {parsed.name && (
                    <p className="text-sm text-gray-700">
                      👤 <span className="font-medium">Ism:</span> {parsed.name}
                    </p>
                  )}

                  {/* Телефон */}
                  {parsed.phone && (
                    <p className="text-sm text-gray-700">
                      📞 <span className="font-medium">Telefon:</span> {parsed.phone}
                    </p>
                  )}

                  {/* Адрес */}
                  {(parsed.address || order.address) && (
                    <p className="text-sm text-gray-700">
                      📍 <span className="font-medium">Manzil:</span> {parsed.address || order.address}
                    </p>
                  )}

                  {/* Примечание */}
                  {parsed.notes && (
                    <p className="text-sm text-gray-600">
                      📝 <span className="font-medium">Izoh:</span> {parsed.notes}
                    </p>
                  )}

                  {/* Дата создания */}
                  <p className="text-xs text-gray-500 pt-2 border-t">
                    Создан: {new Date(order.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
                
                {/* Изменение статуса */}
                <div className="w-full sm:w-auto sm:ml-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 sm:hidden">
                    Изменить статус:
                  </label>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                    className="w-full sm:w-auto px-4 py-2.5 pr-8 border-2 border-primary-500 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-600 cursor-pointer appearance-none text-gray-900"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                      backgroundPosition: 'right 0.75rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.75rem'
                    }}
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
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-md">
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

