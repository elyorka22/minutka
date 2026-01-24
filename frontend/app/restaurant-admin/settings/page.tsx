// ============================================
// Restaurant Admin Settings Page - Настройки ресторана
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Restaurant } from '@/lib/types';
import { getRestaurantById } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function RestaurantAdminSettingsPage() {
  const { user } = useAuth();
  // Получаем restaurant_id из данных пользователя
  const currentRestaurantId = (user?.user as any)?.restaurant_id;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchRestaurant() {
      if (!currentRestaurantId) {
        setLoading(false);
        return;
      }
      try {
        const data = await getRestaurantById(currentRestaurantId);
        setRestaurant(data);
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
    setSaving(true);
    
    // В реальности здесь будет запрос к API
    setTimeout(() => {
      alert('Настройки сохранены!');
      setSaving(false);
    }, 1000);
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
                  defaultValue={restaurant.name}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  defaultValue={restaurant.description || ''}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Телефон
                </label>
                <input
                  type="tel"
                  defaultValue={restaurant.phone || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL изображения
                </label>
                <input
                  type="url"
                  defaultValue={restaurant.image_url || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Часы работы</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {restaurant.working_hours &&
                Object.entries(restaurant.working_hours).map(([day, hours]) => (
                  <div key={day}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                      {day}
                    </label>
                    <input
                      type="text"
                      defaultValue={hours}
                      placeholder="10:00-22:00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Статус</h2>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked={restaurant.is_active}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Ресторан активен</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked={restaurant.is_featured}
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

