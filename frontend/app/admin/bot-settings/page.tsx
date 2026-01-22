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
  const [settings, setSettings] = useState<BotSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const createDefaultSettings = async () => {
    setSaving(true);
    const defaultSettings = [
      {
        key: 'bot_info',
        value: 'Kafeshka - Telegram orqali ovqat yetkazib berish platformasi. Biz bilan siz sevimli taomlaringizni uyingizga buyurtma berishingiz mumkin.'
      },
      {
        key: 'partnership',
        value: 'Hamkorlik uchun biz bilan bog\'laning: @kafeshka_admin yoki email: info@kafeshka.uz'
      },
      {
        key: 'button_bot_info_text',
        value: 'ℹ️ Bot haqida'
      },
      {
        key: 'button_partnership_text',
        value: '🤝 Hamkorlik'
      }
    ];

    try {
      for (const setting of defaultSettings) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/bot-settings/${setting.key}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ value: setting.value }),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to create setting ${setting.key}`);
          }
        } catch (err) {
          console.error(`Error creating setting ${setting.key}:`, err);
        }
      }

      // Перезагружаем настройки
      await fetchSettings();
      alert('Настройки успешно созданы!');
    } catch (error) {
      console.error('Error creating default settings:', error);
      alert('Ошибка при создании настроек. Проверьте подключение к API.');
    } finally {
      setSaving(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bot-settings`);
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      setSettings(data.data || []);
    } catch (error) {
      console.error('Error fetching bot settings:', error);
      setSettings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (setting: BotSetting) => {
    setEditing(setting.key);
    setEditValue(setting.value);
  };

  const handleCancel = () => {
    setEditing(null);
    setEditValue('');
  };

  const handleSave = async (key: string) => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bot-settings/${key}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: editValue }),
      });

      if (!response.ok) {
        throw new Error('Failed to save setting');
      }

      const data = await response.json();
      
      // Обновляем локальное состояние
      setSettings((prev) =>
        prev.map((s) => (s.key === key ? data.data : s))
      );

      setEditing(null);
      setEditValue('');
      alert('Настройка успешно сохранена!');
    } catch (error) {
      console.error('Error saving setting:', error);
      alert('Ошибка при сохранении настройки');
    } finally {
      setSaving(false);
    }
  };

  const getSettingLabel = (key: string) => {
    const labels: Record<string, string> = {
      bot_info: 'ℹ️ Bot haqida (сообщение)',
      partnership: '🤝 Hamkorlik (сообщение)',
      button_bot_info_text: 'ℹ️ Текст кнопки "Bot haqida"',
      button_partnership_text: '🤝 Текст кнопки "Hamkorlik"',
    };
    return labels[key] || key;
  };

  const getSettingDescription = (key: string) => {
    const descriptions: Record<string, string> = {
      bot_info: 'Текст, который пользователь получит при нажатии кнопки "Bot haqida"',
      partnership: 'Текст, который пользователь получит при нажатии кнопки "Hamkorlik"',
      button_bot_info_text: 'Текст, который будет отображаться на кнопке "Bot haqida" в главном меню бота',
      button_partnership_text: 'Текст, который будет отображаться на кнопке "Hamkorlik" в главном меню бота',
    };
    return descriptions[key] || '';
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка настроек...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">🤖 Настройки бота</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <p className="text-gray-600 mb-6">
          Управляйте текстами сообщений и текстами кнопок бота. Вы можете изменить как текст, который получают пользователи при нажатии на кнопки, так и сам текст, который отображается на кнопках.
        </p>

        <div className="space-y-6">
          {settings.map((setting) => (
            <div key={setting.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {getSettingLabel(setting.key)}
                </h3>
                <p className="text-sm text-gray-500">{getSettingDescription(setting.key)}</p>
              </div>

              {editing === setting.key ? (
                <div className="space-y-4">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Введите текст..."
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleSave(setting.key)}
                      disabled={saving}
                      className="w-full sm:w-auto px-6 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="w-full sm:w-auto px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{setting.value}</p>
                  </div>
                  <button
                    onClick={() => handleEdit(setting)}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm"
                  >
                    ✏️ Редактировать
                  </button>
                </div>
              )}
            </div>
          ))}

          {settings.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                Настройки не найдены. Нажмите кнопку ниже, чтобы создать настройки по умолчанию.
              </p>
              <button
                onClick={createDefaultSettings}
                disabled={saving}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {saving ? 'Создание...' : '➕ Создать настройки по умолчанию'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Подсказка</h3>
        <p className="text-sm text-blue-800">
          Вы можете использовать Markdown форматирование в текстах:
          <br />
          <code className="bg-blue-100 px-2 py-1 rounded">*жирный*</code>,{' '}
          <code className="bg-blue-100 px-2 py-1 rounded">_курсив_</code>,{' '}
          <code className="bg-blue-100 px-2 py-1 rounded">`код`</code>
        </p>
      </div>
    </div>
  );
}

