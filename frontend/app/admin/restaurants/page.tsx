// ============================================
// Admin Restaurants Page - Управление ресторанами
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Restaurant } from '@/lib/types';
import { getRestaurants, createRestaurant, updateRestaurant, deleteRestaurant, getRestaurantAdmins, updateRestaurantAdmin } from '@/lib/api';
import ImageUpload from '@/components/ImageUpload';
import { handleApiError } from '@/lib/errorHandler';
import Pagination from '@/components/Pagination';
import { useToast } from '@/contexts/ToastContext';

export default function AdminRestaurantsPage() {
  const { showSuccess, showError } = useToast();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const pageSize = 20;

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        setLoading(true);
        const result = await getRestaurants(undefined, currentPage, pageSize, 'restaurant');
        setRestaurants(result.data);
        setPagination(result.pagination);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchRestaurants();
  }, [currentPage]);

  const handleEdit = async (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот ресторан?')) {
      try {
        await deleteRestaurant(id);
        setRestaurants(restaurants.filter((r) => r.id !== id));
        showSuccess('Ресторан успешно удален!');
      } catch (error) {
        console.error('Error deleting restaurant:', error);
        showError(handleApiError(error));
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
      showSuccess(`Ресторан ${updated.is_active ? 'активирован' : 'деактивирован'}!`);
    } catch (error) {
      console.error('Error updating restaurant:', error);
      showError(handleApiError(error));
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
          delivery_text: restaurant.delivery_text || undefined,
          is_active: restaurant.is_active,
          is_featured: restaurant.is_featured,
        });
        setRestaurants(restaurants.map((r) => (r.id === restaurant.id ? updated : r)));
        showSuccess('Ресторан успешно обновлен!');
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
          delivery_text: restaurant.delivery_text || 'Telegram-bot orqali buyurtma bering',
          is_active: restaurant.is_active,
          is_featured: restaurant.is_featured,
          type: 'restaurant', // Указываем тип как ресторан
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
        
        console.log('Creating restaurant with data:', restaurantData);
        const created = await createRestaurant(restaurantData);
        console.log('Restaurant created successfully:', created);
        setRestaurants([...restaurants, created]);
        showSuccess('Ресторан успешно создан!');
      }
      setShowForm(false);
      setEditingRestaurant(null);
    } catch (error: any) {
      console.error('Error saving restaurant:', error);
      showError(handleApiError(error));
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
          className="w-full sm:w-auto px-6 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base"
        >
          + Добавить ресторан
        </button>
      </div>

      {/* Restaurants List - Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Изображение
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Название
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Описание
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Телефон
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
                  {restaurant.image_url ? (
                    <img
                      src={restaurant.image_url}
                      alt={restaurant.name}
                      className="h-16 w-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      🍽️
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{restaurant.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 line-clamp-2 max-w-xs">
                    {restaurant.description || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{restaurant.phone || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(restaurant.id)}
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      restaurant.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {restaurant.is_active ? 'Активен' : 'Неактивен'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(restaurant)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDelete(restaurant.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Restaurants List - Mobile View */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {restaurants.map((restaurant) => (
          <div key={restaurant.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex gap-4 mb-3">
              {restaurant.image_url ? (
                <img
                  src={restaurant.image_url}
                  alt={restaurant.name}
                  className="h-20 w-20 object-cover rounded-lg"
                />
              ) : (
                <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">
                  🍽️
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{restaurant.name}</h3>
                {restaurant.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{restaurant.description}</p>
                )}
                {restaurant.phone && (
                  <p className="text-sm text-gray-500">📞 {restaurant.phone}</p>
                )}
              </div>
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

      {pagination && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
          hasNext={pagination.hasNext}
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
    delivery_text: restaurant?.delivery_text || 'Telegram-bot orqali buyurtma bering',
    is_active: restaurant?.is_active ?? true,
    is_featured: restaurant?.is_featured ?? false,
    admin_telegram_id: '', // Поле для Telegram ID админа (только при создании)
    admin_phone: '', // Поле для телефона админа
    admin_password: '', // Поле для пароля админа
  });
  
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // Обновляем formData при изменении restaurant
  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        phone: restaurant.phone || '',
        image_url: restaurant.image_url || '',
        delivery_text: restaurant.delivery_text || 'Telegram-bot orqali buyurtma bering',
        is_active: restaurant.is_active ?? true,
        is_featured: restaurant.is_featured ?? false,
        admin_telegram_id: '',
        admin_phone: '',
        admin_password: '',
      });
    }
  }, [restaurant]);

  // Загружаем данные админа при редактировании
  useEffect(() => {
    async function loadAdmin() {
      if (restaurant?.id) {
        try {
          setLoadingAdmin(true);
          const admins = await getRestaurantAdmins(restaurant.id);
          if (admins && admins.length > 0) {
            const admin = admins[0];
            setFormData(prev => ({
              ...prev,
              admin_phone: admin.phone || '',
            }));
          }
        } catch (error) {
          console.error('Error loading admin:', error);
        } finally {
          setLoadingAdmin(false);
        }
      }
    }
    loadAdmin();
  }, [restaurant?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRestaurant: Restaurant & { admin_telegram_id?: number } = {
      id: restaurant?.id || '', // При создании оставляем пустым, сервер сгенерирует UUID
      name: formData.name,
      description: formData.description || null,
      phone: formData.phone || null,
      image_url: formData.image_url || null,
      delivery_text: formData.delivery_text || 'Telegram-bot orqali buyurtma bering',
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {restaurant ? 'Редактировать ресторан' : 'Добавить ресторан'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название ресторана *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                rows={3}
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

            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              folder="restaurants"
              label="Изображение ресторана"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Текст о доставке
              </label>
              <textarea
                value={formData.delivery_text}
                onChange={(e) => setFormData({ ...formData, delivery_text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                rows={2}
                placeholder="Telegram-bot orqali buyurtma bering"
              />
            </div>

            {!store && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telegram ID админа ресторана (опционально)
                  </label>
                  <input
                    type="number"
                    value={formData.admin_telegram_id}
                    onChange={(e) => setFormData({ ...formData, admin_telegram_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="123456789"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Если указан, будет создан админ ресторана с этим Telegram ID
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон админа (опционально)
                  </label>
                  <input
                    type="text"
                    value={formData.admin_phone}
                    onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+998901234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Пароль админа (опционально)
                  </label>
                  <input
                    type="password"
                    value={formData.admin_password}
                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Минимум 6 символов"
                  />
                </div>
              </>
            )}

            {store && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон админа
                  </label>
                  <input
                    type="text"
                    value={formData.admin_phone}
                    onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+998901234567"
                    disabled={loadingAdmin}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Новый пароль админа (оставьте пустым, чтобы не менять)
                  </label>
                  <input
                    type="password"
                    value={formData.admin_password}
                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Минимум 6 символов"
                  />
                </div>
              </>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                Активен
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="is_featured" className="ml-2 text-sm font-medium text-gray-700">
                Рекомендуемый
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
              >
                {restaurant ? 'Сохранить изменения' : 'Создать ресторан'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

