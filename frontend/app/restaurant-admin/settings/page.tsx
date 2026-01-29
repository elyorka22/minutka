// ============================================
// Restaurant Admin Settings Page - Настройки ресторана
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Restaurant } from '@/lib/types';
import { getRestaurantById, updateRestaurant, getRestaurantAdmins, updateRestaurantAdmin } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ImageUpload from '@/components/ImageUpload';
import { useToast } from '@/contexts/ToastContext';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Понедельник' },
  { key: 'tuesday', label: 'Вторник' },
  { key: 'wednesday', label: 'Среда' },
  { key: 'thursday', label: 'Четверг' },
  { key: 'friday', label: 'Пятница' },
  { key: 'saturday', label: 'Суббота' },
  { key: 'sunday', label: 'Воскресенье' },
];

export default function RestaurantAdminSettingsPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  // Получаем restaurant_id из данных пользователя
  const currentRestaurantId = (user?.user as any)?.restaurant_id;
  const currentAdminId = (user?.user as any)?.id;
  
  // Отладочная информация
  useEffect(() => {
    console.log('RestaurantAdminSettingsPage - User data:', {
      user,
      currentRestaurantId,
      currentAdminId,
      userUser: user?.user
    });
  }, [user, currentRestaurantId, currentAdminId]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [updatingNotifications, setUpdatingNotifications] = useState(false);
  
  // Состояние для формы
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    image_url: '',
    delivery_text: '',
    is_active: true,
    is_featured: false,
    working_hours: {} as Record<string, string>,
  });

  useEffect(() => {
    async function fetchData() {
      if (!currentRestaurantId) {
        setLoading(false);
        return;
      }
      try {
        const [restaurantData, adminsData] = await Promise.all([
          getRestaurantById(currentRestaurantId),
          currentAdminId ? getRestaurantAdmins(currentRestaurantId) : Promise.resolve([])
        ]);
        
        setRestaurant(restaurantData);
        // Инициализируем форму данными ресторана
        setFormData({
          name: restaurantData.name || '',
          description: restaurantData.description || '',
          phone: restaurantData.phone || '',
          image_url: restaurantData.image_url || '',
          delivery_text: restaurantData.delivery_text || 'Telegram-bot orqali buyurtma bering',
          is_active: restaurantData.is_active ?? true,
          is_featured: restaurantData.is_featured ?? false,
          working_hours: (restaurantData.working_hours as Record<string, string>) || {},
        });

        // Находим текущего админа и загружаем настройку уведомлений
        if (currentAdminId && adminsData) {
          console.log('Looking for admin with ID:', currentAdminId);
          console.log('Available admins:', adminsData.map((a: any) => ({ id: a.id, notifications_enabled: a.notifications_enabled })));
          const currentAdmin = adminsData.find((admin: any) => admin.id === currentAdminId);
          if (currentAdmin) {
            console.log('Found current admin:', currentAdmin);
            setNotificationsEnabled(currentAdmin.notifications_enabled ?? true);
          } else {
            console.warn('Current admin not found in admins list');
            // Если админ не найден, используем значение по умолчанию
            setNotificationsEnabled(true);
          }
        } else {
          console.warn('currentAdminId or adminsData missing:', { currentAdminId, adminsData: !!adminsData });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentRestaurantId, currentAdminId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentRestaurantId || !restaurant) {
      alert('Ошибка: не удалось определить ресторан');
      return;
    }

    setSaving(true);
    
    try {
      const updated = await updateRestaurant(currentRestaurantId, {
        name: formData.name,
        description: formData.description || undefined,
        phone: formData.phone || undefined,
        image_url: formData.image_url || undefined,
        delivery_text: formData.delivery_text || undefined,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        working_hours: formData.working_hours,
      });
      
      setRestaurant(updated);
      alert('Настройки успешно сохранены!');
    } catch (error) {
      console.error('Error updating restaurant:', error);
      alert('Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleWorkingHoursChange = (day: string, from: string, to: string) => {
    setFormData(prev => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: from && to ? `${from}-${to}` : '',
      },
    }));
  };

  const handleToggleNotifications = async () => {
    console.log('handleToggleNotifications called', { currentAdminId, notificationsEnabled });
    
    if (!currentAdminId) {
      console.error('currentAdminId is missing:', { currentAdminId, user: user?.user });
      showError('Не удалось определить админа. Пожалуйста, перезагрузите страницу.');
      return;
    }

    setUpdatingNotifications(true);
    try {
      const newValue = !notificationsEnabled;
      console.log(`Updating notifications_enabled for admin ${currentAdminId} to ${newValue}`);
      
      const updateData = {
        notifications_enabled: newValue
      };
      console.log('Sending update request:', { id: currentAdminId, data: updateData });
      
      const updated = await updateRestaurantAdmin(currentAdminId, updateData);
      console.log('Updated admin response:', updated);
      
      if (!updated) {
        throw new Error('Не удалось обновить настройку');
      }
      
      setNotificationsEnabled(updated.notifications_enabled ?? newValue);
      
      // Перезагружаем данные админов, чтобы убедиться, что значение обновилось
      if (currentRestaurantId) {
        try {
          const adminsData = await getRestaurantAdmins(currentRestaurantId);
          console.log('Reloaded admins data:', adminsData);
          const currentAdmin = adminsData.find((admin: any) => admin.id === currentAdminId);
          if (currentAdmin) {
            console.log('Reloaded current admin data:', currentAdmin);
            setNotificationsEnabled(currentAdmin.notifications_enabled ?? true);
          } else {
            console.warn('Current admin not found after reload');
          }
        } catch (error) {
          console.error('Error reloading admin data:', error);
        }
      }
      
      showSuccess(newValue ? 'Уведомления включены' : 'Уведомления отключены');
    } catch (error: any) {
      console.error('Error updating notifications:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Ошибка при обновлении настройки уведомлений';
      showError(errorMessage);
    } finally {
      setUpdatingNotifications(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка настроек...</div>;
  }

  if (!restaurant) {
    return <div className="text-center py-12">Ресторан не найден</div>;
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">⚙️ Настройки ресторана</h1>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Основная информация</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название ресторана *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Текст о доставке
                </label>
                <textarea
                  value={formData.delivery_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_text: e.target.value }))}
                  rows={2}
                  placeholder="Telegram-bot orqali buyurtma bering"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Этот текст будет отображаться на странице ресторана под описанием
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Изображение ресторана
                </label>
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData(prev => ({ ...prev, image_url: url || '' }))}
                />
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Часы работы</h2>
            <div className="space-y-4">
              {DAYS_OF_WEEK.map(({ key, label }) => {
                const hours = formData.working_hours[key] || '';
                const [from = '', to = ''] = hours.split('-');
                
                return (
                  <div key={key} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">От</label>
                      <input
                        type="time"
                        value={from}
                        onChange={(e) => handleWorkingHoursChange(key, e.target.value, to)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm text-gray-900 bg-white"
                        style={{ color: '#111827' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">До</label>
                      <input
                        type="time"
                        value={to}
                        onChange={(e) => handleWorkingHoursChange(key, from, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm text-gray-900 bg-white"
                        style={{ color: '#111827' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Статус</h2>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Ресторан активен</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Топ ресторан</span>
              </label>
            </div>
          </div>

          {/* Bot Notifications */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Уведомления в боте</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Уведомления о новых заказах
                  </p>
                  <p className="text-xs text-gray-500">
                    Получать уведомления о новых заказах в Telegram-боте
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleNotifications}
                  disabled={updatingNotifications}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    notificationsEnabled ? 'bg-primary-500' : 'bg-gray-200'
                  } ${updatingNotifications ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto bg-primary-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

