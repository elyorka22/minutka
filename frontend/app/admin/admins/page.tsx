// ============================================
// Admin Admins Page - Управление админами ресторанов
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { RestaurantAdmin, Restaurant } from '@/lib/types';
import { getRestaurantAdmins, getRestaurants, createRestaurantAdmin, deleteRestaurantAdmin } from '@/lib/api';
import { handleApiError } from '@/lib/errorHandler';
import { useToast } from '@/contexts/ToastContext';

export default function AdminAdminsPage() {
  const { showSuccess, showError } = useToast();
  const [admins, setAdmins] = useState<(RestaurantAdmin & { restaurants?: Restaurant })[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    restaurant_id: '',
    telegram_id: '',
    password: '',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [adminsData, restaurantsResult] = await Promise.all([
          getRestaurantAdmins(undefined, true), // Получаем админов с ресторанами
          getRestaurants()
        ]);
        setAdmins(adminsData);
        setRestaurants(restaurantsResult.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        showError(handleApiError(error));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [showError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.restaurant_id || !formData.telegram_id || !formData.password) {
      showError('Заполните все обязательные поля');
      return;
    }

    try {
      await createRestaurantAdmin({
        restaurant_id: formData.restaurant_id,
        telegram_id: formData.telegram_id,
        password: formData.password,
        is_active: true,
      });
      
      showSuccess('Админ успешно добавлен');
      setShowForm(false);
      setFormData({ restaurant_id: '', telegram_id: '', password: '' });
      
      // Обновляем список админов
      const adminsData = await getRestaurantAdmins(undefined, true);
      setAdmins(adminsData);
    } catch (error) {
      console.error('Error creating admin:', error);
      showError(handleApiError(error));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого админа?')) {
      return;
    }

    try {
      await deleteRestaurantAdmin(id);
      showSuccess('Админ успешно удален');
      setAdmins(admins.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Error deleting admin:', error);
      showError(handleApiError(error));
    }
  };

  const getRestaurantName = (admin: RestaurantAdmin & { restaurants?: Restaurant }) => {
    if (admin.restaurants) {
      return admin.restaurants.name;
    }
    const restaurant = restaurants.find((r) => r.id === admin.restaurant_id);
    return restaurant?.name || 'Неизвестный ресторан';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка админов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">👥 Управление админами</h1>
          <button
            onClick={() => {
              setFormData({ restaurant_id: '', telegram_id: '', password: '' });
              setShowForm(true);
            }}
            className="w-full sm:w-auto bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base"
          >
            + Добавить админа
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Добавить админа</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ресторан <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.restaurant_id}
                    onChange={(e) => setFormData({ ...formData, restaurant_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Выберите ресторан</option>
                    {restaurants.map((restaurant) => (
                      <option key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telegram ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.telegram_id}
                    onChange={(e) => setFormData({ ...formData, telegram_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="123456789"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Пароль <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Минимум 6 символов"
                    required
                    minLength={6}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
                  >
                    Создать
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setFormData({ restaurant_id: '', telegram_id: '', password: '' });
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Admins Table - Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ресторан
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telegram ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Имя
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
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Нет админов
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getRestaurantName(admin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.telegram_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.username || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.first_name || '-'} {admin.last_name || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          admin.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {admin.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDelete(admin.id)}
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

        {/* Admins Cards - Mobile */}
        <div className="md:hidden space-y-4">
          {admins.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
              Нет админов
            </div>
          ) : (
            admins.map((admin) => (
              <div key={admin.id} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{getRestaurantName(admin)}</h3>
                    <p className="text-sm text-gray-500">ID: {admin.telegram_id}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      admin.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {admin.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  {admin.username && <p>Username: {admin.username}</p>}
                  {(admin.first_name || admin.last_name) && (
                    <p>
                      Имя: {admin.first_name || ''} {admin.last_name || ''}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(admin.id)}
                  className="w-full bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm"
                >
                  Удалить
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

