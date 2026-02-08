// ============================================
// Telegram Link Page - Упрощенная версия
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { getMyRestaurant, sendTelegramLinkMessage } from '@/lib/api';
import { Restaurant } from '@/lib/types';
import { useToast } from '@/contexts/ToastContext';
import { handleApiError } from '@/lib/errorHandler';

export default function TelegramLinkPage() {
  const { showSuccess, showError } = useToast();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [codeShown, setCodeShown] = useState(false);

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
        // Устанавливаем текст по умолчанию
        setMessageText(`${data.name} - ${data.menu_button_text || 'Меню'}`);
      } catch (error) {
        console.error('Error loading restaurant:', error);
        showError(handleApiError(error));
      } finally {
        setLoading(false);
      }
    }
    loadRestaurant();
  }, [showError]);

  const handleCreate = async () => {
    if (!restaurant) return;

    if (!messageText.trim()) {
      showError('Введите текст сообщения');
      return;
    }

    try {
      setSaving(true);
      // Сохраняем сообщение в БД (без отправки админу)
      const result = await sendTelegramLinkMessage(
        restaurant.id, 
        messageText.trim(),
        null
      );
      
      if (result.success) {
        showSuccess('Сообщение успешно создано!');
        setCodeShown(true);
      } else {
        showError(result.message || result.error || 'Не удалось создать сообщение');
      }
    } catch (error: any) {
      console.error('Error creating Telegram link message:', error);
      
      let errorMessage = 'Не удалось создать сообщение';
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.details) {
          errorMessage = `${errorData.error || 'Ошибка'}: ${errorData.details}`;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="text-lg font-semibold">Ресторан не найден</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">🔗 Ссылка для Telegram</h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Текст сообщения
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`${restaurant.name} - ${restaurant.menu_button_text || 'Меню'}`}
                rows={4}
                maxLength={1000}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                {messageText.length} / 1000 символов
              </p>
            </div>

            <button
              onClick={handleCreate}
              disabled={saving || !messageText.trim()}
              className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Создание...' : 'Создать'}
            </button>

            {codeShown && (
              <div className="mt-6 p-6 bg-green-50 rounded-lg border-2 border-green-300">
                <p className="text-lg font-bold text-gray-900 mb-4 text-center">
                  ✅ Сообщение создано!
                </p>
                
                <div className="mb-4 p-4 bg-white rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    📋 Код для использования в группе:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-4 py-3 bg-gray-100 rounded-lg text-base font-mono text-gray-800 break-all">
                      /меню {restaurant.id}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`/меню ${restaurant.id}`);
                        showSuccess('Код скопирован!');
                      }}
                      className="px-4 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap"
                    >
                      📋 Копировать
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    📖 <strong>Как использовать:</strong>
                  </p>
                  <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                    <li>Добавьте бота в группу Telegram как администратора</li>
                    <li>В группе отправьте команду: <code className="bg-white px-1 py-0.5 rounded text-primary-600 font-mono">/меню</code></li>
                    <li>Бот попросит ввести ID ресторана</li>
                    <li>Введите или вставьте ID: <code className="bg-white px-1 py-0.5 rounded text-primary-600 font-mono">{restaurant.id}</code></li>
                    <li>Бот отправит сообщение с кнопкой меню в группу</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
