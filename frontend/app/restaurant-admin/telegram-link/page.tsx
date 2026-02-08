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
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');

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
      setSending(true);
      // Отправляем сообщение админу (без указания группы)
      const result = await sendTelegramLinkMessage(
        restaurant.id, 
        messageText.trim(),
        null // Не указываем группу, отправляем админу
      );
      
      if (result.success) {
        showSuccess('Сообщение успешно сохранено! Теперь используйте команду /меню в группе для отправки.');
        // Не очищаем поле, чтобы можно было редактировать
      } else {
        showError(result.message || result.error || 'Не удалось сохранить сообщение');
      }
    } catch (error: any) {
      console.error('Error sending Telegram link message:', error);
      
      // Пытаемся извлечь понятное сообщение об ошибке из ответа
      let errorMessage = 'Не удалось отправить сообщение в Telegram';
      
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
      setSending(false);
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
              disabled={sending || !messageText.trim()}
              className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Сохранение...' : 'Сохранить'}
            </button>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700 font-semibold mb-2">
                💡 <strong>Как это работает:</strong>
              </p>
              <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                <li>Введите текст сообщения</li>
                <li>Нажмите кнопку "Сохранить"</li>
                <li>Сообщение будет сохранено в системе</li>
                <li>В группе Telegram отправьте команду <code className="bg-white px-1 py-0.5 rounded text-primary-600 font-mono">/меню</code></li>
                <li>Бот попросит ввести ID ресторана</li>
                <li>Введите ID ресторана (показан ниже)</li>
                <li>Бот отправит сообщение с кнопкой меню в группу</li>
              </ol>
            </div>

            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-700 font-semibold mb-2">
                🤖 <strong>ID ресторана для команды /меню:</strong>
              </p>
              <div className="mt-3 p-3 bg-white rounded border border-green-200">
                <p className="text-xs text-gray-500 mb-1">Скопируйте этот ID для использования в команде /меню:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono text-gray-800 break-all">
                    {restaurant.id}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(restaurant.id);
                      showSuccess('ID ресторана скопирован!');
                    }}
                    className="px-3 py-2 bg-primary-500 text-white rounded text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap"
                  >
                    📋 Копировать
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
