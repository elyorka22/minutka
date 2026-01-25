// ============================================
// Admin Restaurant Admins Page - Управление админами ресторанов
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { RestaurantAdmin, Restaurant } from '@/lib/types';
import { getRestaurantAdmins, getRestaurants, createRestaurantAdmin, updateRestaurantAdmin, deleteRestaurantAdmin } from '@/lib/api';

export default function AdminRestaurantAdminsPage() {
  const [admins, setAdmins] = useState<RestaurantAdmin[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<RestaurantAdmin | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [adminsData, restaurantsData] = await Promise.all([
          getRestaurantAdmins(),
          getRestaurants()
        ]);
        setAdmins(adminsData);
        setRestaurants(restaurantsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleEdit = (admin: RestaurantAdmin) => {
    setEditingAdmin(admin);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этого админа?')) {
      try {
        await deleteRestaurantAdmin(id);
        setAdmins(admins.filter((a) => a.id !== id));
      } catch (error) {
        console.error('Error deleting admin:', error);
        alert('Ошибка при удалении админа');
      }
    }
  };

  const handleSave = async (admin: RestaurantAdmin) => {
    try {
      if (admin.id && admin.id !== Date.now().toString()) {
        // Обновление существующего админа
        const updated = await updateRestaurantAdmin(admin.id, {
          username: admin.username,
          first_name: admin.first_name,
          last_name: admin.last_name,
          is_active: admin.is_active,
        });
        setAdmins(admins.map((a) => (a.id === admin.id ? updated : a)));
      } else {
        // Создание нового админа
        const adminWithPassword = admin as RestaurantAdmin & { password?: string };
        if (!adminWithPassword.password) {
          alert('Пожалуйста, укажите пароль для нового админа');
          return;
        }
        const created = await createRestaurantAdmin({
          restaurant_id: admin.restaurant_id,
          telegram_id: admin.telegram_id,
          username: admin.username,
          first_name: admin.first_name,
          last_name: admin.last_name,
          is_active: admin.is_active,
          password: adminWithPassword.password,
        });
        setAdmins([...admins, created]);
      }
      setShowForm(false);
      setEditingAdmin(null);
    } catch (error) {
      console.error('Error saving admin:', error);
      alert('Ошибка при сохранении админа');
    }
  };

  const getRestaurantName = (restaurantId: string) => {
    const restaurant = restaurants.find((r) => r.id === restaurantId);
    return restaurant?.name || 'Неизвестный ресторан';
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка админов...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">👤 Управление админами ресторанов</h1>
        <button
          onClick={() => {
            setEditingAdmin(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base"
        >
          + Назначить админа
        </button>
      </div>

      {/* Admins Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ресторан
              </th>
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
                Дата назначения
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {getRestaurantName(admin.restaurant_id)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {admin.first_name} {admin.last_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {admin.username ? `@${admin.username}` : '—'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {admin.telegram_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(admin.created_at).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(admin)}
                    className="text-primary-600 hover:text-primary-900 mr-4"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(admin.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Admins Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {admins.map((admin) => (
          <div key={admin.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {admin.first_name} {admin.last_name}
              </h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">🍽️ {getRestaurantName(admin.restaurant_id)}</p>
                {admin.username && (
                  <p className="text-gray-600">👤 @{admin.username}</p>
                )}
                <p className="text-gray-500">🆔 {admin.telegram_id}</p>
                <p className="text-gray-500 text-xs">
                  📅 {new Date(admin.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-gray-200">
              <button
                onClick={() => handleEdit(admin)}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm"
              >
                ✏️ Редактировать
              </button>
              <button
                onClick={() => handleDelete(admin.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Form Modal */}
      {showForm && (
        <AdminFormModal
          admin={editingAdmin}
          restaurants={restaurants}
          onClose={() => {
            setShowForm(false);
            setEditingAdmin(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// Admin Form Modal Component
function AdminFormModal({
  admin,
  restaurants,
  onClose,
  onSave,
}: {
  admin: RestaurantAdmin | null;
  restaurants: Restaurant[];
  onClose: () => void;
  onSave: (admin: RestaurantAdmin) => void;
}) {
  const [formData, setFormData] = useState({
    restaurant_id: admin?.restaurant_id || '',
    telegram_id: admin?.telegram_id?.toString() || '',
    username: admin?.username || '',
    first_name: admin?.first_name || '',
    last_name: admin?.last_name || '',
    password: '', // Пароль только при создании
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin && !formData.password) {
      alert('Пожалуйста, укажите пароль для нового админа');
      return;
    }
    const newAdmin: RestaurantAdmin & { password?: string } = {
      id: admin?.id || Date.now().toString(),
      restaurant_id: formData.restaurant_id,
      telegram_id: parseInt(formData.telegram_id),
      username: formData.username || null,
      first_name: formData.first_name || null,
      last_name: formData.last_name || null,
      is_active: true,
      created_at: admin?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      password: !admin ? formData.password : undefined, // Пароль только при создании
    };
    onSave(newAdmin as RestaurantAdmin);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {admin ? 'Редактировать админа' : 'Назначить админа'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl flex-shrink-0">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ресторан *
              </label>
              <select
                value={formData.restaurant_id}
                onChange={(e) => setFormData({ ...formData, restaurant_id: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                Telegram ID *
              </label>
              <input
                type="number"
                value={formData.telegram_id}
                onChange={(e) => setFormData({ ...formData, telegram_id: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="123456789"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="username"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm sm:text-base"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="w-full sm:flex-1 bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base"
              >
                Сохранить
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

