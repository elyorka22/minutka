// ============================================
// Admin Restaurants Page - Управление ресторанами
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Restaurant } from '@/lib/types';
import { getRestaurants, createRestaurant, updateRestaurant, deleteRestaurant, getRestaurantAdmins, updateRestaurantAdmin } from '@/lib/api';
import ImageUpload from '@/components/ImageUpload';

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        const data = await getRestaurants();
        setRestaurants(data);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchRestaurants();
  }, []);

  const handleEdit = async (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот ресторан?')) {
      try {
        await deleteRestaurant(id);
        setRestaurants(restaurants.filter((r) => r.id !== id));
      } catch (error) {
        console.error('Error deleting restaurant:', error);
        alert('Ошибка при удалении ресторана');
      }
    }
  };

  const handleToggleActive = async (id: string) => {
    const restaurant = restaurants.find((r) => r.id === id);
    if (!restaurant) return;

    try {
      const updated = await updateRestaurant(id, {
        is_active: !restaurant.is_active
      });
      setRestaurants(restaurants.map((r) => (r.id === id ? updated : r)));
    } catch (error) {
      console.error('Error updating restaurant:', error);
      alert('Ошибка при обновлении ресторана');
    }
  };

  const handleSave = async (restaurant: Restaurant) => {
    try {
      // Проверяем, редактируем ли мы существующий ресторан
      const isEditing = editingRestaurant && restaurants.some((r) => r.id === restaurant.id);
      
      if (isEditing) {
        // Обновление существующего ресторана
        const updated = await updateRestaurant(restaurant.id, {
          name: restaurant.name,
          description: restaurant.description || undefined,
          phone: restaurant.phone || undefined,
          image_url: restaurant.image_url || undefined,
          is_active: restaurant.is_active,
          is_featured: restaurant.is_featured,
        });
        setRestaurants(restaurants.map((r) => (r.id === restaurant.id ? updated : r)));
      } else {
        // Создание нового ресторана
        const adminTelegramId = (restaurant as any).admin_telegram_id;
        const adminPhone = (restaurant as any).admin_phone;
        const adminPassword = (restaurant as any).admin_password;
        const restaurantData: any = {
          name: restaurant.name,
          description: restaurant.description || undefined,
          phone: restaurant.phone || undefined,
          image_url: restaurant.image_url || undefined,
          is_active: restaurant.is_active,
          is_featured: restaurant.is_featured,
        };
        
        // Добавляем admin_telegram_id только если он указан и не пустой
        if (adminTelegramId && adminTelegramId !== '' && !isNaN(Number(adminTelegramId))) {
          restaurantData.admin_telegram_id = Number(adminTelegramId);
        }
        
        // Добавляем admin_phone если указан
        if (adminPhone && adminPhone !== '') {
          restaurantData.admin_phone = adminPhone;
        }
        
        // Добавляем admin_password если указан
        if (adminPassword && adminPassword !== '') {
          restaurantData.admin_password = adminPassword;
        }
        
        const created = await createRestaurant(restaurantData);
        setRestaurants([...restaurants, created]);
      }
      setShowForm(false);
      setEditingRestaurant(null);
    } catch (error) {
      console.error('Error saving restaurant:', error);
      alert('Ошибка при сохранении ресторана');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка ресторанов...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🍽️ Управление ресторанами</h1>
        <button
          onClick={() => {
            setEditingRestaurant(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base"
        >
          + Добавить ресторан
        </button>
      </div>

      {/* Restaurants Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Название
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Телефон ресторана
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Админ (телефон/пароль)
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
            {restaurants.map((restaurant) => (
              <tr key={restaurant.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">{restaurant.name}</span>
                    {restaurant.is_featured && (
                      <span className="ml-2 text-yellow-500">⭐</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {restaurant.phone || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {(restaurant as any).admin ? (
                    <div>
                      <div>📞 {(restaurant as any).admin.phone || '—'}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        🔑 {(restaurant as any).admin.password ? '***' : '—'}
                      </div>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(restaurant.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      restaurant.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {restaurant.is_active ? 'Активен' : 'Неактивен'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(restaurant)}
                    className="text-primary-600 hover:text-primary-900 mr-4"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(restaurant.id)}
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

      {/* Restaurants Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {restaurants.map((restaurant) => (
          <div key={restaurant.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
                  {restaurant.is_featured && (
                    <span className="text-yellow-500">⭐</span>
                  )}
                </div>
                {restaurant.phone && (
                  <p className="text-sm text-gray-600">📞 Ресторан: {restaurant.phone}</p>
                )}
                {(restaurant as any).admin && (
                  <div className="text-sm text-gray-600 mt-1">
                    <p>👤 Админ: 📞 {(restaurant as any).admin.phone || '—'}</p>
                    <p className="text-xs text-gray-500">🔑 Пароль: {(restaurant as any).admin.password ? '***' : '—'}</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleToggleActive(restaurant.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                  restaurant.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {restaurant.is_active ? 'Активен' : 'Неактивен'}
              </button>
            </div>
            <div className="flex gap-2 pt-3 border-t border-gray-200">
              <button
                onClick={() => handleEdit(restaurant)}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm"
              >
                ✏️ Редактировать
              </button>
              <button
                onClick={() => handleDelete(restaurant.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Restaurant Form Modal */}
      {showForm && (
        <RestaurantFormModal
          restaurant={editingRestaurant}
          onClose={() => {
            setShowForm(false);
            setEditingRestaurant(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// Restaurant Form Modal Component
function RestaurantFormModal({
  restaurant,
  onClose,
  onSave,
}: {
  restaurant: Restaurant | null;
  onClose: () => void;
  onSave: (restaurant: Restaurant) => void;
}) {
  const [formData, setFormData] = useState({
    name: restaurant?.name || '',
    description: restaurant?.description || '',
    phone: restaurant?.phone || '',
    image_url: restaurant?.image_url || '',
    is_active: restaurant?.is_active ?? true,
    is_featured: restaurant?.is_featured ?? false,
    admin_telegram_id: '', // Поле для Telegram ID админа (только при создании)
    admin_phone: '', // Поле для телефона админа
    admin_password: '', // Поле для пароля админа
  });
  
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // Загружаем данные админа при редактировании
  useEffect(() => {
    async function loadAdminData() {
      if (restaurant?.id) {
        setLoadingAdmin(true);
        try {
          const admins = await getRestaurantAdmins(restaurant.id);
          if (admins && admins.length > 0) {
            const admin = admins[0];
            setFormData(prev => ({
              ...prev,
              admin_phone: admin.phone || '',
              admin_password: '', // Не показываем текущий пароль
            }));
          }
        } catch (error) {
          console.error('Error loading admin data:', error);
        } finally {
          setLoadingAdmin(false);
        }
      }
    }
    loadAdminData();
  }, [restaurant?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRestaurant: Restaurant & { admin_telegram_id?: number } = {
      id: restaurant?.id || '', // При создании оставляем пустым, сервер сгенерирует UUID
      name: formData.name,
      description: formData.description || null,
      phone: formData.phone || null,
      image_url: formData.image_url || null,
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      working_hours: restaurant?.working_hours || null,
      telegram_chat_id: restaurant?.telegram_chat_id || null,
      created_at: restaurant?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Добавляем admin_telegram_id, admin_phone, admin_password только при создании нового ресторана
    if (!restaurant) {
      if (formData.admin_telegram_id) {
        (newRestaurant as any).admin_telegram_id = parseInt(formData.admin_telegram_id);
      }
      if (formData.admin_phone) {
        (newRestaurant as any).admin_phone = formData.admin_phone;
      }
      if (formData.admin_password) {
        (newRestaurant as any).admin_password = formData.admin_password;
      }
    } else {
      // При редактировании передаем данные админа
      if (formData.admin_phone !== undefined) {
        (newRestaurant as any).admin_phone = formData.admin_phone;
      }
      if (formData.admin_password !== undefined) {
        (newRestaurant as any).admin_password = formData.admin_password;
      }
    }

    onSave(newRestaurant);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {restaurant ? 'Редактировать ресторан' : 'Добавить ресторан'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl flex-shrink-0">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Телефон
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <ImageUpload
              value={formData.image_url || ''}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              folder="restaurants"
              label="Изображение ресторана"
              required={false}
            />

            {!restaurant && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telegram ID админа ресторана (опционально)
                </label>
                <input
                  type="text"
                  value={formData.admin_telegram_id}
                  onChange={(e) => setFormData({ ...formData, admin_telegram_id: e.target.value })}
                  placeholder="Введите Telegram ID админа"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Если указать Telegram ID, админ будет автоматически создан и сможет войти в панель ресторана
                </p>
              </div>
            )}

            {restaurant && (
              <>
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Данные админа ресторана</h3>
                  {loadingAdmin ? (
                    <p className="text-sm text-gray-500">Загрузка данных админа...</p>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Телефон админа ресторана
                        </label>
                        <input
                          type="tel"
                          value={formData.admin_phone}
                          onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value })}
                          placeholder="Введите телефон админа"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Новый пароль админа (оставьте пустым, чтобы не менять)
                        </label>
                        <input
                          type="password"
                          value={formData.admin_password}
                          onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                          placeholder="Введите новый пароль или оставьте пустым"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Оставьте пустым, чтобы не менять текущий пароль
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {!restaurant && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон админа ресторана (опционально)
                  </label>
                  <input
                    type="tel"
                    value={formData.admin_phone}
                    onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value })}
                    placeholder="Введите телефон админа"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Пароль админа ресторана (опционально)
                  </label>
                  <input
                    type="password"
                    value={formData.admin_password}
                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                    placeholder="Введите пароль для админа"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Пароль будет использоваться для входа в систему
                  </p>
                </div>
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2 w-4 h-4"
                />
                <span className="text-sm text-gray-700">Активен</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="mr-2 w-4 h-4"
                />
                <span className="text-sm text-gray-700">Топ ресторан</span>
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

