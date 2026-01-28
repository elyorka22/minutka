// ============================================
// Restaurant Admin Settings Page - Настройки ресторана
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Restaurant } from '@/lib/types';
import { getRestaurantById, updateRestaurant } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ImageUpload from '@/components/ImageUpload';

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
  // Получаем restaurant_id из данных пользователя
  const currentRestaurantId = (user?.user as any)?.restaurant_id;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Состояние для формы
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    image_url: '',
    is_active: true,
    is_featured: false,
    working_hours: {} as Record<string, string>,
  });

  useEffect(() => {
    async function fetchRestaurant() {
      if (!currentRestaurantId) {
        setLoading(false);
        return;
      }
      try {
        const data = await getRestaurantById(currentRestaurantId);
        setRestaurant(data);
        // Инициализируем форму данными ресторана
        setFormData({
          name: data.name || '',
          description: data.description || '',
          phone: data.phone || '',
          image_url: data.image_url || '',
          is_active: data.is_active ?? true,
          is_featured: data.is_featured ?? false,
          working_hours: (data.working_hours as Record<string, string>) || {},
        });
      } catch (error) {
        console.error('Error fetching restaurant:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchRestaurant();
  }, [currentRestaurantId]);

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

