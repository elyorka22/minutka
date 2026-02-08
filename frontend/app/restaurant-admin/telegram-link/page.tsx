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
  const [groupChatId, setGroupChatId] = useState('');

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

  // Функция для извлечения chat_id или username из ссылки
  const parseGroupIdentifier = (input: string): string | null => {
    if (!input.trim()) return null;
    
    // Если это число (chat_id), возвращаем как есть
    if (/^-?\d+$/.test(input.trim())) {
      return input.trim();
    }
    
    // Если это ссылка t.me/username или @username, извлекаем username
    const linkMatch = input.match(/(?:t\.me\/|@)([a-zA-Z0-9_]+)/);
    if (linkMatch) {
      return `@${linkMatch[1]}`;
    }
    
    // Если уже начинается с @, возвращаем как есть
    if (input.trim().startsWith('@')) {
      return input.trim();
    }
    
    return null;
  };

  const handleCreate = async () => {
    if (!restaurant) return;

    if (!messageText.trim()) {
      showError('Введите текст сообщения');
      return;
    }

    try {
      setSending(true);
      // Парсим идентификатор группы (может быть chat_id или username)
      const parsedId = parseGroupIdentifier(groupChatId);
      
      // Если это число (chat_id), передаем как есть
      // Если это username (начинается с @), передаем как username
      const groupIdentifier = parsedId || null;
      
      const result = await sendTelegramLinkMessage(
        restaurant.id, 
        messageText.trim(),
        groupIdentifier
      );
      
      if (result.success) {
        showSuccess(result.message || 'Сообщение успешно отправлено в Telegram!');
        // Очищаем поле после успешной отправки
        setMessageText(`${restaurant.name} - ${restaurant.menu_button_text || 'Меню'}`);
      } else {
        showError(result.message || 'Не удалось отправить сообщение');
      }
    } catch (error) {
      console.error('Error sending Telegram link message:', error);
      showError(handleApiError(error));
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
                Chat ID группы или username (необязательно)
              </label>
              <input
                type="text"
                value={groupChatId}
                onChange={(e) => setGroupChatId(e.target.value)}
                placeholder="-1001234567890 или @groupname или t.me/groupname"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500">
                  Если указано, сообщение отправится напрямую в группу. Если не указано, отправится админу.
                </p>
                <details className="text-xs text-gray-600">
                  <summary className="cursor-pointer font-medium text-primary-600 hover:text-primary-700">
                    📖 Как получить Chat ID группы?
                  </summary>
                  <div className="mt-2 pl-4 space-y-2 border-l-2 border-primary-200">
                    <p><strong>Способ 1 (рекомендуется):</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Добавьте бота <code className="bg-gray-100 px-1 rounded">@userinfobot</code> в вашу группу</li>
                      <li>Отправьте любое сообщение в группу</li>
                      <li>Бот ответит с информацией, включая Chat ID (число вида <code className="bg-gray-100 px-1 rounded">-1001234567890</code>)</li>
                    </ol>
                    <p className="mt-2"><strong>Способ 2:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Добавьте вашего бота в группу как администратора</li>
                      <li>Для публичных групп можно использовать username (например, <code className="bg-gray-100 px-1 rounded">@groupname</code>)</li>
                      <li>Для приватных групп обязательно нужен Chat ID (число)</li>
                    </ol>
                    <p className="mt-2 text-orange-600">
                      ⚠️ <strong>Важно:</strong> Бот должен быть добавлен в группу и иметь права на отправку сообщений!
                    </p>
                  </div>
                </details>
              </div>
            </div>

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
              {sending ? 'Отправка...' : 'Создать'}
            </button>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700 font-semibold mb-2">
                💡 <strong>Как это работает:</strong>
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Введите текст сообщения</li>
                <li>При необходимости укажите Chat ID или username группы</li>
                <li>Нажмите кнопку "Создать"</li>
                <li>Сообщение с кнопкой меню будет отправлено в указанную группу или админу</li>
                <li>Кнопка откроет меню ресторана прямо в Telegram Web App</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
