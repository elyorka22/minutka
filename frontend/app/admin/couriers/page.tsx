// ============================================
// Admin Couriers Page - Управление курьерами
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Courier, Restaurant } from '@/lib/types';
import { getCouriers, createCourier, updateCourier, deleteCourier, getRestaurants } from '@/lib/api';
import { handleApiError } from '@/lib/errorHandler';

export default function AdminCouriersPage() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);
  const [formData, setFormData] = useState({
    telegram_id: '',
    username: '',
    first_name: '',
    last_name: '',
    phone: '',
    restaurant_id: '',
    is_active: true
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [couriersData, restaurantsResult] = await Promise.all([
          getCouriers(),
          getRestaurants()
        ]);
        setCouriers(couriersData);
        setRestaurants(restaurantsResult.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        alert(handleApiError(error));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleEdit = (courier: Courier) => {
    setEditingCourier(courier);
    setFormData({
      telegram_id: courier.telegram_id.toString(),
      username: courier.username || '',
      first_name: courier.first_name || '',
      last_name: courier.last_name || '',
      phone: courier.phone || '',
      restaurant_id: courier.restaurant_id || '',
      is_active: courier.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этого курьера?')) {
      try {
        await deleteCourier(id);
        setCouriers(couriers.filter((c) => c.id !== id));
      } catch (error) {
        console.error('Error deleting courier:', error);
        alert(handleApiError(error));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const courierData = {
        telegram_id: parseInt(formData.telegram_id),
        username: formData.username || null,
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        phone: formData.phone || null,
        restaurant_id: formData.restaurant_id || null,
        ...(editingCourier ? { is_active: formData.is_active } : {})
      };

      if (editingCourier) {
        const updated = await updateCourier(editingCourier.id, courierData);
        setCouriers(couriers.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const newCourier = await createCourier(courierData);
        setCouriers([...couriers, newCourier]);
      }

      setShowForm(false);
      setEditingCourier(null);
      setFormData({
        telegram_id: '',
        username: '',
        first_name: '',
        last_name: '',
        phone: '',
        restaurant_id: '',
        is_active: true
      });
    } catch (error) {
      console.error('Error saving courier:', error);
      alert(handleApiError(error));
    }
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка курьеров...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🚚 Управление курьерами</h1>
        <button
          onClick={() => {
            setEditingCourier(null);
            setFormData({
              telegram_id: '',
              username: '',
              first_name: '',
              last_name: '',
              phone: '',
              restaurant_id: '',
              is_active: true
            });
            setShowForm(true);
          }}
          className="w-full sm:w-auto bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base"
        >
          + Добавить курьера
        </button>
      </div>

      {/* Couriers Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Имя
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telegram ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Телефон
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ресторан
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {couriers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Курьеры не найдены
                </td>
              </tr>
            ) : (
              couriers.map((courier) => (
                <tr key={courier.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {courier.first_name || courier.last_name
                        ? `${courier.first_name || ''} ${courier.last_name || ''}`.trim()
                        : 'Не указано'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {courier.username ? `@${courier.username}` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{courier.telegram_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{courier.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {courier.restaurant_id 
                        ? restaurants.find(r => r.id === courier.restaurant_id)?.name || 'Неизвестный ресторан'
                        : 'Общий курьер'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(courier)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDelete(courier.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Couriers Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {couriers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            Курьеры не найдены
          </div>
        ) : (
          couriers.map((courier) => (
            <div key={courier.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-gray-900">
                    {courier.first_name || courier.last_name
                      ? `${courier.first_name || ''} ${courier.last_name || ''}`.trim()
                      : 'Не указано'}
                  </div>
                  {courier.username && (
                    <div className="text-sm text-gray-600">@{courier.username}</div>
                  )}
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    courier.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {courier.is_active ? 'Активен' : 'Неактивен'}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <div>Telegram ID: {courier.telegram_id}</div>
                {courier.phone && <div>Телефон: {courier.phone}</div>}
                <div>
                  Ресторан: {courier.restaurant_id 
                    ? restaurants.find(r => r.id === courier.restaurant_id)?.name || 'Неизвестный ресторан'
                    : 'Общий курьер'}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleEdit(courier)}
                  className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-600"
                >
                  Редактировать
                </button>
                <button
                  onClick={() => handleDelete(courier.id)}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingCourier ? 'Редактировать курьера' : 'Добавить курьера'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telegram ID *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.telegram_id}
                    onChange={(e) => setFormData({ ...formData, telegram_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    disabled={!!editingCourier}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Имя
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Фамилия
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+998901234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ресторан
                  </label>
                  <select
                    value={formData.restaurant_id}
                    onChange={(e) => setFormData({ ...formData, restaurant_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Общий курьер (видит все заказы)</option>
                    {restaurants.map((restaurant) => (
                      <option key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Если не выбран ресторан, курьер будет общим и увидит все заказы
                  </p>
                </div>
                {editingCourier && (
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Активен</span>
                    </label>
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-600"
                  >
                    {editingCourier ? 'Сохранить' : 'Создать'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingCourier(null);
                      setFormData({
                        telegram_id: '',
                        username: '',
                        first_name: '',
                        last_name: '',
                        phone: '',
                        restaurant_id: '',
                        is_active: true
                      });
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-400"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

