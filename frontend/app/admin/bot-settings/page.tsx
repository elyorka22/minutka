// ============================================
// Bot Settings Page - Управление текстами бота
// ============================================

'use client';

import { useState, useEffect } from 'react';

interface BotSetting {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function BotSettingsPage() {
  const [buttonBotInfoText, setButtonBotInfoText] = useState('');
  const [buttonPartnershipText, setButtonPartnershipText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchButtonTexts();
  }, []);

  const fetchButtonTexts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bot-settings`);
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      const settings = data.data || [];
      
      // Находим тексты кнопок
      const botInfoSetting = settings.find((s: BotSetting) => s.key === 'button_bot_info_text');
      const partnershipSetting = settings.find((s: BotSetting) => s.key === 'button_partnership_text');
      
      setButtonBotInfoText(botInfoSetting?.value || 'ℹ️ Bot haqida');
      setButtonPartnershipText(partnershipSetting?.value || '🤝 Hamkorlik');
    } catch (error) {
      console.error('Error fetching bot settings:', error);
      // Используем значения по умолчанию
      setButtonBotInfoText('ℹ️ Bot haqida');
      setButtonPartnershipText('🤝 Hamkorlik');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Сохраняем оба текста кнопок
      const [botInfoResponse, partnershipResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/bot-settings/button_bot_info_text`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ value: buttonBotInfoText }),
        }),
        fetch(`${API_BASE_URL}/api/bot-settings/button_partnership_text`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ value: buttonPartnershipText }),
        }),
      ]);

      if (!botInfoResponse.ok || !partnershipResponse.ok) {
        throw new Error('Failed to save settings');
      }

      alert('Настройки успешно сохранены!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Ошибка при сохранении настроек');
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
          Измените тексты кнопок, которые отображаются в главном меню бота.
        </p>

        <div className="space-y-6">
          {/* Поле для текста кнопки "Bot haqida" */}
          <div className="border-b border-gray-200 pb-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                ℹ️ Текст кнопки "Bot haqida"
              </h3>
              <p className="text-sm text-gray-500">
                Текст, который будет отображаться на кнопке "Bot haqida" в главном меню бота
              </p>
            </div>
            <div>
              <input
                type="text"
                value={buttonBotInfoText}
                onChange={(e) => setButtonBotInfoText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Введите текст кнопки..."
                disabled={loading || saving}
              />
            </div>
          </div>

          {/* Поле для текста кнопки "Hamkorlik" */}
          <div className="border-b border-gray-200 pb-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                🤝 Текст кнопки "Hamkorlik"
              </h3>
              <p className="text-sm text-gray-500">
                Текст, который будет отображаться на кнопке "Hamkorlik" в главном меню бота
              </p>
            </div>
            <div>
              <input
                type="text"
                value={buttonPartnershipText}
                onChange={(e) => setButtonPartnershipText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Введите текст кнопки..."
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

