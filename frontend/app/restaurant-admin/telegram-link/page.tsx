// ============================================
// Telegram Link Page - Настройка ссылки для Telegram
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { getMyRestaurant, updateRestaurant, getMenuViewStatistics } from '@/lib/api';
import { Restaurant } from '@/lib/types';
import { useToast } from '@/contexts/ToastContext';
import { handleApiError } from '@/lib/errorHandler';

export default function TelegramLinkPage() {
  const { showSuccess, showError } = useToast();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menuButtonText, setMenuButtonText] = useState('');
  const [statistics, setStatistics] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    async function loadRestaurant() {
      try {
        setLoading(true);
        const selectedRestaurantId = localStorage.getItem('selected_restaurant_id');
        if (!selectedRestaurantId) {
          showError('Ресторан не выбран');
          return;
        }
        const data = await getMyRestaurant(selectedRestaurantId);
        setRestaurant(data);
        setMenuButtonText(data.menu_button_text || 'Меню');
      } catch (error) {
        console.error('Error loading restaurant:', error);
        showError(handleApiError(error));
      } finally {
        setLoading(false);
      }
    }
    loadRestaurant();
  }, [showError]);

  useEffect(() => {
    async function loadStatistics() {
      if (!restaurant) return;
      try {
        setLoadingStats(true);
        const stats = await getMenuViewStatistics(restaurant.id);
        setStatistics(stats);
      } catch (error) {
        console.error('Error loading statistics:', error);
      } finally {
        setLoadingStats(false);
      }
    }
    loadStatistics();
  }, [restaurant]);

  const handleSave = async () => {
    if (!restaurant) return;
    try {
      setSaving(true);
      const updated = await updateRestaurant(restaurant.id, {
        menu_button_text: menuButtonText || 'Меню',
      });
      setRestaurant(updated);
      showSuccess('Текст кнопки успешно сохранен!');
    } catch (error) {
      console.error('Error saving menu button text:', error);
      showError(handleApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const getMenuUrl = () => {
    if (!restaurant) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/menu/${restaurant.id}`;
  };

  const getTelegramButtonCode = () => {
    if (!restaurant) return '';
    const menuUrl = getMenuUrl();
    const buttonText = menuButtonText || 'Меню';
    const restaurantName = restaurant.name;

    // Формат для Telegram Bot API (inline keyboard)
    return `{
  "text": "${restaurantName} - ${buttonText}",
  "url": "${menuUrl}"
}`;
  };

  const getTelegramWebAppButtonCode = () => {
    if (!restaurant) return '';
    const menuUrl = getMenuUrl();
    const buttonText = menuButtonText || 'Меню';

    // Формат для Telegram Web App кнопки
    return `{
  "text": "${buttonText}",
  "web_app": {
    "url": "${menuUrl}"
  }
}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showSuccess('Скопировано в буфер обмена!');
    }).catch((error) => {
      console.error('Error copying to clipboard:', error);
      showError('Не удалось скопировать');
    });
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка...</div>;
  }

  if (!restaurant) {
    return <div className="text-center py-12 text-red-500">Ресторан не найден</div>;
  }

  const menuUrl = getMenuUrl();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 px-2 sm:px-0">🔗 Ссылка для Telegram</h1>

      {/* Настройка текста кнопки */}
      <div className="bg-white rounded-lg shadow-sm sm:shadow-md p-4 sm:p-6 mb-4 sm:mb-6 mx-2 sm:mx-0">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Настройка текста кнопки</h2>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Текст кнопки меню
            </label>
            <input
              type="text"
              value={menuButtonText}
              onChange={(e) => setMenuButtonText(e.target.value)}
              placeholder="Меню"
              maxLength={100}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Максимум 100 символов
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {/* Ссылка на меню */}
      <div className="bg-white rounded-lg shadow-sm sm:shadow-md p-4 sm:p-6 mb-4 sm:mb-6 mx-2 sm:mx-0">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Ссылка на меню</h2>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              URL меню
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={menuUrl}
                readOnly
                className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg bg-gray-50 break-all"
              />
              <button
                onClick={() => copyToClipboard(menuUrl)}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                📋 Копировать
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Код для Telegram */}
      <div className="bg-white rounded-lg shadow-sm sm:shadow-md p-4 sm:p-6 mb-4 sm:mb-6 mx-2 sm:mx-0">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Код для Telegram Bot API</h2>
        <div className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inline Keyboard Button
            </label>
            <div className="space-y-2">
              <div className="relative">
                <pre className="p-3 sm:p-4 bg-gray-50 border border-gray-300 rounded-lg text-xs sm:text-sm overflow-x-auto font-mono">
                  {getTelegramButtonCode()}
                </pre>
              </div>
              <button
                onClick={() => copyToClipboard(getTelegramButtonCode())}
                className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
              >
                📋 Копировать код
              </button>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Web App Button
              </label>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">Рекомендуется</span>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <pre className="p-3 sm:p-4 bg-gray-50 border border-gray-300 rounded-lg text-xs sm:text-sm overflow-x-auto font-mono">
                  {getTelegramWebAppButtonCode()}
                </pre>
              </div>
              <button
                onClick={() => copyToClipboard(getTelegramWebAppButtonCode())}
                className="w-full sm:w-auto px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm"
              >
                📋 Копировать код
              </button>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-gray-600">
              Web App кнопка открывает меню прямо в Telegram
            </p>
          </div>
        </div>
      </div>

      {/* Инструкция */}
      <div className="bg-blue-50 rounded-lg shadow-sm sm:shadow-md p-4 sm:p-6 mb-4 sm:mb-6 mx-2 sm:mx-0">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">📝 Инструкция</h2>
        <ol className="list-decimal list-inside space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
          <li>Скопируйте код <strong>Web App Button</strong></li>
          <li>В вашем Telegram боте создайте сообщение с текстом: <strong className="break-words">{restaurant.name} - {menuButtonText || 'Меню'}</strong></li>
          <li>Добавьте кнопку, используя скопированный код</li>
          <li>Закрепите сообщение в группе ресторана</li>
        </ol>
      </div>

      {/* Статистика */}
      {statistics && (
        <div className="bg-white rounded-lg shadow-sm sm:shadow-md p-4 sm:p-6 mx-2 sm:mx-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">📊 Статистика переходов</h2>
          {loadingStats ? (
            <div className="text-center py-4 text-sm sm:text-base">Загрузка статистики...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-primary-600">{statistics.total_views || 0}</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">Всего просмотров</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-primary-600">{statistics.unique_users || 0}</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">Уникальных пользователей</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-primary-600">
                  {statistics.last_7_days?.reduce((sum: number, day: any) => sum + day.views, 0) || 0}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">За последние 7 дней</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

