// ============================================
// Restaurant Admin Order Settings Page - Управление заказами
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useRestaurantId } from '@/hooks/useRestaurantId';
import { getRestaurantById, updateRestaurant } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

export default function OrderSettingsPage() {
  const { showSuccess, showError } = useToast();
  const restaurantId = useRestaurantId();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chefNotificationsEnabled, setChefNotificationsEnabled] = useState(true);
  const [adminNotificationsEnabled, setAdminNotificationsEnabled] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      if (!restaurantId) {
        setLoading(false);
        return;
      }

      try {
        const restaurant = await getRestaurantById(restaurantId);
        setChefNotificationsEnabled(restaurant.chef_notifications_enabled ?? true);
        setAdminNotificationsEnabled(restaurant.admin_notifications_enabled ?? true);
      } catch (error) {
        console.error('Error fetching order settings:', error);
        showError('Ошибка при загрузке настроек');
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [restaurantId, showError]);

  const handleToggleChefNotifications = async () => {
    if (!restaurantId) return;

    setSaving(true);
    try {
      const newValue = !chefNotificationsEnabled;
      await updateRestaurant(restaurantId, {
        chef_notifications_enabled: newValue,
      });
      setChefNotificationsEnabled(newValue);
      showSuccess(newValue ? 'Уведомления для повара включены' : 'Уведомления для повара отключены');
    } catch (error) {
      console.error('Error updating chef notifications:', error);
      showError('Ошибка при обновлении настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAdminNotifications = async () => {
    if (!restaurantId) return;

    setSaving(true);
    try {
      const newValue = !adminNotificationsEnabled;
      await updateRestaurant(restaurantId, {
        admin_notifications_enabled: newValue,
      });
      setAdminNotificationsEnabled(newValue);
      showSuccess(newValue ? 'Уведомления для админа включены' : 'Уведомления для админа отключены');
    } catch (error) {
      console.error('Error updating admin notifications:', error);
      showError('Ошибка при обновлении настроек');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка настроек...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">📦 Управление заказами</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Chef Notifications */}
        <div className="border-b pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">👨‍🍳 Уведомления для повара</h2>
              <p className="text-sm text-gray-600 mb-2">
                Если включено, повар получит уведомление о новом заказе с кнопкой "Готов".
                После нажатия "Готов" админ получит уведомление с кнопкой "Передать курьеру".
              </p>
              <p className="text-xs text-gray-500">
                Если выключено, админ сразу получит уведомление с кнопкой "Передать курьеру".
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleChefNotifications}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                chefNotificationsEnabled ? 'bg-primary-500' : 'bg-gray-200'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  chefNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <div className={`p-3 rounded-lg ${chefNotificationsEnabled ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
            <p className="text-sm font-medium text-gray-700">
              Статус: {chefNotificationsEnabled ? '✅ Включено' : '❌ Выключено'}
            </p>
          </div>
        </div>

        {/* Admin Notifications */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">👤 Уведомления для админа</h2>
              <p className="text-sm text-gray-600 mb-2">
                Если включено, админ получит уведомление о готовом заказе (после нажатия поваром "Готов")
                или сразу о новом заказе (если уведомления для повара выключены).
              </p>
              <p className="text-xs text-gray-500">
                Уведомление содержит кнопку "Передать курьеру" для передачи заказа курьеру.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleAdminNotifications}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                adminNotificationsEnabled ? 'bg-primary-500' : 'bg-gray-200'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  adminNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <div className={`p-3 rounded-lg ${adminNotificationsEnabled ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
            <p className="text-sm font-medium text-gray-700">
              Статус: {adminNotificationsEnabled ? '✅ Включено' : '❌ Выключено'}
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ Как это работает:</h3>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>Если <strong>повар включен</strong>: повар получает уведомление → нажимает "Готов" → админ получает уведомление</li>
            <li>Если <strong>повар выключен</strong>: админ сразу получает уведомление с кнопкой "Передать курьеру"</li>
            <li>Если <strong>админ выключен</strong>: админ не получит уведомления, даже если повар нажал "Готов"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

