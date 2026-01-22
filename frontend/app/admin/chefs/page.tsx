// ============================================
// Admin Chefs Page - Управление поварами
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Chef } from '@/lib/types';
import { demoRestaurants } from '@/lib/demoData';

// Демо данные поваров
const demoChefs: Chef[] = [
  {
    id: '1',
    restaurant_id: '1',
    telegram_id: 111222333,
    telegram_chat_id: 111222333,
    username: 'chef_pizza',
    first_name: 'Иван',
    last_name: 'Поваров',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    restaurant_id: '2',
    telegram_id: 444555666,
    telegram_chat_id: 444555666,
    username: 'chef_sushi',
    first_name: 'Мария',
    last_name: 'Суши',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function AdminChefsPage() {
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingChef, setEditingChef] = useState<Chef | null>(null);

  useEffect(() => {
    setChefs(demoChefs);
    setLoading(false);
  }, []);

  const handleEdit = (chef: Chef) => {
    setEditingChef(chef);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этого повара?')) {
      setChefs(chefs.filter((c) => c.id !== id));
    }
  };

  const getRestaurantName = (restaurantId: string) => {
    const restaurant = demoRestaurants.find((r) => r.id === restaurantId);
    return restaurant?.name || 'Неизвестный ресторан';
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка поваров...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">👨‍🍳 Управление поварами</h1>
        <button
          onClick={() => {
            setEditingChef(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base"
        >
          + Добавить повара
        </button>
      </div>

      {/* Chefs Table - Desktop */}
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
                Chat ID
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
            {chefs.map((chef) => (
              <tr key={chef.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {getRestaurantName(chef.restaurant_id)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {chef.first_name} {chef.last_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {chef.username ? `@${chef.username}` : '—'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {chef.telegram_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {chef.telegram_chat_id || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      chef.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {chef.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(chef)}
                    className="text-primary-600 hover:text-primary-900 mr-4"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(chef.id)}
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

      {/* Chefs Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {chefs.map((chef) => (
          <div key={chef.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {chef.first_name} {chef.last_name}
              </h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">🍽️ {getRestaurantName(chef.restaurant_id)}</p>
                {chef.username && (
                  <p className="text-gray-600">👤 @{chef.username}</p>
                )}
                <p className="text-gray-500">🆔 {chef.telegram_id}</p>
                {chef.telegram_chat_id && (
                  <p className="text-gray-500">💬 Chat ID: {chef.telegram_chat_id}</p>
                )}
                <p className="text-gray-500 text-xs">
                  📅 {new Date(chef.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
              <div className="mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    chef.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {chef.is_active ? 'Активен' : 'Неактивен'}
                </span>
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-gray-200">
              <button
                onClick={() => handleEdit(chef)}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm"
              >
                ✏️ Редактировать
              </button>
              <button
                onClick={() => handleDelete(chef.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Chef Form Modal */}
      {showForm && (
        <ChefFormModal
          chef={editingChef}
          onClose={() => {
            setShowForm(false);
            setEditingChef(null);
          }}
          onSave={(chef) => {
            if (editingChef) {
              setChefs(chefs.map((c) => (c.id === chef.id ? chef : c)));
            } else {
              setChefs([...chefs, chef]);
            }
            setShowForm(false);
            setEditingChef(null);
          }}
        />
      )}
    </div>
  );
}

// Chef Form Modal Component
function ChefFormModal({
  chef,
  onClose,
  onSave,
}: {
  chef: Chef | null;
  onClose: () => void;
  onSave: (chef: Chef) => void;
}) {
  const [formData, setFormData] = useState({
    restaurant_id: chef?.restaurant_id || '',
    telegram_id: chef?.telegram_id?.toString() || '',
    telegram_chat_id: chef?.telegram_chat_id?.toString() || '',
    username: chef?.username || '',
    first_name: chef?.first_name || '',
    last_name: chef?.last_name || '',
    is_active: chef?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newChef: Chef = {
      id: chef?.id || Date.now().toString(),
      restaurant_id: formData.restaurant_id,
      telegram_id: parseInt(formData.telegram_id),
      telegram_chat_id: formData.telegram_chat_id ? parseInt(formData.telegram_chat_id) : null,
      username: formData.username || null,
      first_name: formData.first_name || null,
      last_name: formData.last_name || null,
      is_active: formData.is_active,
      created_at: chef?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onSave(newChef);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {chef ? 'Редактировать повара' : 'Добавить повара'}
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
                {demoRestaurants.map((restaurant) => (
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
                Telegram Chat ID * (для получения уведомлений о заказах в боте)
              </label>
              <input
                type="number"
                value={formData.telegram_chat_id}
                onChange={(e) => setFormData({ ...formData, telegram_chat_id: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="123456789"
              />
              <p className="text-xs text-gray-500 mt-1">
                Chat ID, на который будут приходить уведомления о новых заказах в Telegram-боте
              </p>
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

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2 w-4 h-4"
                />
                <span className="text-sm text-gray-700">Активен</span>
              </label>
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


