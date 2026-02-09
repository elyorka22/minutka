// ============================================
// Restaurant Admin Couriers Page - Управление курьерами ресторана
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Courier } from '@/lib/types';
import { getCouriers, createCourier } from '@/lib/api';
import { handleApiError } from '@/lib/errorHandler';
import { useRestaurantId } from '@/hooks/useRestaurantId';

export default function RestaurantAdminCouriersPage() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [telegramId, setTelegramId] = useState('');
  const restaurantId = useRestaurantId();

  useEffect(() => {
    async function fetchCouriers() {
      try {
        const couriersData = await getCouriers();
        setCouriers(couriersData);
      } catch (error) {
        console.error('Error fetching couriers:', error);
        alert(handleApiError(error));
      } finally {
        setLoading(false);
      }
    }
    fetchCouriers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!telegramId || !telegramId.trim()) {
      alert('Telegram ID обязателен');
      return;
    }

    const telegramIdNum = parseInt(telegramId.trim());
    if (isNaN(telegramIdNum)) {
      alert('Telegram ID должен быть числом');
      return;
    }

    try {
      setSaving(true);
      const courierData = {
        telegram_id: telegramIdNum,
      };

      const newCourier = await createCourier(courierData);
      setCouriers([...couriers, newCourier]);
      
      setShowForm(false);
      setTelegramId('');
    } catch (error) {
      console.error('Error creating courier:', error);
      alert(handleApiError(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка курьеров...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🚚 Курьеры ресторана</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
        >
          {showForm ? 'Отмена' : '+ Добавить курьера'}
        </button>
      </div>

      {/* Форма создания курьера */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Добавить нового курьера</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telegram ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="123456789"
                required
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-500">
                Введите Telegram ID курьера. Остальные данные будут заполнены автоматически при первом входе.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Сохранение...' : 'Создать курьера'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setTelegramId('');
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список курьеров */}
      {couriers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 text-lg">Курьеры не найдены</p>
          <p className="text-gray-400 text-sm mt-2">Добавьте первого курьера для вашего ресторана</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telegram ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Имя
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Фамилия
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Телефон
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {couriers.map((courier) => (
                  <tr key={courier.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {courier.telegram_id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {courier.username || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {courier.first_name || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {courier.last_name || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {courier.phone || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          courier.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {courier.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

