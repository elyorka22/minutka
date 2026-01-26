// ============================================
// Bot Settings Page - Управление текстами бота
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';

interface BotSetting {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function BotSettingsPage() {
  const { showSuccess, showError } = useToast();
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [botInfoMessage, setBotInfoMessage] = useState('');
  const [partnershipMessage, setPartnershipMessage] = useState('');
  const [appSlogan, setAppSlogan] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bot-settings`);
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      const settings = data.data || [];
      
      // Находим тексты сообщений
      const welcomeSetting = settings.find((s: BotSetting) => s.key === 'welcome_message');
      const botInfoSetting = settings.find((s: BotSetting) => s.key === 'bot_info');
      const partnershipSetting = settings.find((s: BotSetting) => s.key === 'partnership');
      const appSloganSetting = settings.find((s: BotSetting) => s.key === 'app_slogan');
      
      setWelcomeMessage(welcomeSetting?.value || '🍽️ *Minutka\'ga xush kelibsiz!*\n\nBuyurtma berish uchun restoran tanlang:');
      setBotInfoMessage(botInfoSetting?.value || 'Minutka - Telegram orqali ovqat yetkazib berish platformasi. Biz bilan siz sevimli taomlaringizni uyingizga buyurtma berishingiz mumkin.');
      setPartnershipMessage(partnershipSetting?.value || 'Hamkorlik uchun biz bilan bog\'laning: @minutka_admin yoki email: info@minutka.uz');
      setAppSlogan(appSloganSetting?.value || 'Telegram orqali ovqat yetkazib berish');
    } catch (error) {
      console.error('Error fetching bot settings:', error);
      // Используем значения по умолчанию
      setWelcomeMessage('🍽️ *Minutka\'ga xush kelibsiz!*\n\nBuyurtma berish uchun restoran tanlang:');
      setBotInfoMessage('Minutka - Telegram orqali ovqat yetkazib berish platformasi. Biz bilan siz sevimli taomlaringizni uyingizga buyurtma berishingiz mumkin.');
      setPartnershipMessage('Hamkorlik uchun biz bilan bog\'laning: @minutka_admin yoki email: info@minutka.uz');
      setAppSlogan('Telegram orqali ovqat yetkazib berish');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Сохраняем все тексты сообщений
      const [welcomeResponse, botInfoResponse, partnershipResponse, appSloganResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/bot-settings/welcome_message`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ value: welcomeMessage }),
        }),
        fetch(`${API_BASE_URL}/api/bot-settings/bot_info`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ value: botInfoMessage }),
        }),
        fetch(`${API_BASE_URL}/api/bot-settings/partnership`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ value: partnershipMessage }),
        }),
        fetch(`${API_BASE_URL}/api/bot-settings/app_slogan`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ value: appSlogan }),
        }),
      ]);

      if (!welcomeResponse.ok || !botInfoResponse.ok || !partnershipResponse.ok || !appSloganResponse.ok) {
        throw new Error('Failed to save settings');
      }

      showSuccess('Настройки успешно сохранены!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showError('Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка настроек...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">🤖 Настройки бота</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <p className="text-gray-600 mb-6">
          Измените тексты сообщений бота: welcome сообщение при запуске и сообщения при нажатии на кнопки.
        </p>

        <div className="space-y-6">
          {/* Поле для welcome сообщения */}
          <div className="border-b border-gray-200 pb-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                👋 Welcome сообщение
              </h3>
              <p className="text-sm text-gray-500">
                Текст, который пользователь получит при запуске бота (команда /start)
              </p>
            </div>
            <div>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Введите welcome сообщение..."
                disabled={loading || saving}
              />
            </div>
          </div>

          {/* Поле для текста сообщения "Bot haqida" */}
          <div className="border-b border-gray-200 pb-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                ℹ️ Сообщение "Bot haqida"
              </h3>
              <p className="text-sm text-gray-500">
                Текст, который пользователь получит при нажатии на кнопку "Bot haqida"
              </p>
            </div>
            <div>
              <textarea
                value={botInfoMessage}
                onChange={(e) => setBotInfoMessage(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Введите текст сообщения..."
                disabled={loading || saving}
              />
            </div>
          </div>

          {/* Поле для текста сообщения "Hamkorlik" */}
          <div className="border-b border-gray-200 pb-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                🤝 Сообщение "Hamkorlik"
              </h3>
              <p className="text-sm text-gray-500">
                Текст, который пользователь получит при нажатии на кнопку "Hamkorlik"
              </p>
            </div>
            <div>
              <textarea
                value={partnershipMessage}
                onChange={(e) => setPartnershipMessage(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Введите текст сообщения..."
                disabled={loading || saving}
              />
            </div>
          </div>

          {/* Поле для слогана приложения */}
          <div className="border-b border-gray-200 pb-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                📱 Слоган приложения
              </h3>
              <p className="text-sm text-gray-500">
                Текст, который отображается под названием "Minutka" на главной странице сайта
              </p>
            </div>
            <div>
              <input
                type="text"
                value={appSlogan}
                onChange={(e) => setAppSlogan(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Введите слоган приложения..."
                disabled={loading || saving}
              />
            </div>
          </div>

          {/* Кнопка сохранения */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading || saving}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saving ? 'Сохранение...' : '💾 Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

