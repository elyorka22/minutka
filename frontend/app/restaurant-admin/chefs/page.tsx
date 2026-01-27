// ============================================
// Restaurant Admin - Manage Chefs Page
// Управление поварами ресторана (доступно админам ресторана)
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Chef } from '@/lib/types';
import { getChefs, createChef, updateChef, deleteChef } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { handleApiError } from '@/lib/errorHandler';

export default function RestaurantAdminChefsPage() {
  const { user } = useAuth();
  // Получаем restaurant_id из данных пользователя
  const currentRestaurantId = (user?.user as any)?.restaurant_id;
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingChef, setEditingChef] = useState<Chef | null>(null);

  useEffect(() => {
    async function fetchChefs() {
      if (!currentRestaurantId) {
        setLoading(false);
        return;
      }
      try {
        const data = await getChefs(currentRestaurantId);
        setChefs(data);
      } catch (error) {
        console.error('Error fetching chefs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchChefs();
  }, [currentRestaurantId]);

  const handleEdit = (chef: Chef) => {
    setEditingChef(chef);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этого повара?')) {
      try {
        await deleteChef(id);
        setChefs(chefs.filter((c) => c.id !== id));
      } catch (error) {
        console.error('Error deleting chef:', error);
        alert(handleApiError(error));
      }
    }
  };

  const handleSave = async (chef: Chef) => {
    if (!currentRestaurantId) {
      alert('Ошибка: не удалось определить ресторан');
      return;
    }

    try {
      if (chef.id && chefs.some((c) => c.id === chef.id)) {
        // Обновление существующего повара - только chat_id
        const updated = await updateChef(chef.id, {
          telegram_chat_id: chef.telegram_chat_id ?? undefined,
        });
        setChefs(chefs.map((c) => (c.id === chef.id ? updated : c)));
      } else {
        // Создание нового повара - только chat_id
        if (!chef.telegram_chat_id) {
          alert('Пожалуйста, укажите Telegram Chat ID для получения уведомлений');
          return;
        }
        const chefData: any = {
          restaurant_id: currentRestaurantId,
          telegram_id: chef.telegram_chat_id, // Используем chat_id как telegram_id
          telegram_chat_id: chef.telegram_chat_id,
          is_active: true,
        };
        const created = await createChef(chefData);
        setChefs([...chefs, created]);
      }
      setShowForm(false);
      setEditingChef(null);
    } catch (error) {
      console.error('Error saving chef:', error);
      alert(handleApiError(error));
    }
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка поваров...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">👨‍🍳 Управление поварами</h1>
          <p className="text-sm text-gray-600 mt-2">
            Создавайте и управляйте поварами для вашего ресторана. Повара получают уведомления о новых заказах.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingChef(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base"
        >
          + Добавить повара
        </button>
      </div>

      {/* Chefs Cards */}
      <div className="space-y-4">
        {chefs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 text-lg">Поваров пока нет</p>
            <p className="text-sm text-gray-400 mt-2">Добавьте первого повара для получения уведомлений о заказах</p>
          </div>
        ) : (
          chefs.map((chef) => (
            <div key={chef.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Повар
                  </h3>
                  <div className="space-y-1 text-sm">
                    {chef.telegram_chat_id && (
                      <p className="text-gray-700">💬 Chat ID: {chef.telegram_chat_id}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleEdit(chef)}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm"
                  >
                    ✏️ Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(chef.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm"
                  >
                    🗑️ Удалить
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chef Form Modal */}
      {showForm && (
        <ChefFormModal
          chef={editingChef}
          onClose={() => {
            setShowForm(false);
            setEditingChef(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// Chef Form Modal Component
function ChefFormModal({
  chef,
  onClose,
  onSave,
}: {
  chef: Chef | null;
  onClose: () => void;
  onSave: (chef: Chef) => void;
}) {
  const [formData, setFormData] = useState({
    telegram_chat_id: chef?.telegram_chat_id?.toString() || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.telegram_chat_id) {
      alert('Пожалуйста, укажите Telegram Chat ID для получения уведомлений');
      return;
    }

    const newChef: Chef = {
      id: chef?.id || '',
      restaurant_id: chef?.restaurant_id || '',
      telegram_id: parseInt(formData.telegram_chat_id), // Используем chat_id как telegram_id
      telegram_chat_id: parseInt(formData.telegram_chat_id),
      username: null,
      first_name: null,
      last_name: null,
      is_active: true,
      created_at: chef?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onSave(newChef);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {chef ? 'Редактировать повара' : 'Добавить повара'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl flex-shrink-0">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telegram Chat ID * (для уведомлений)
              </label>
              <input
                type="text"
                value={formData.telegram_chat_id}
                onChange={(e) => setFormData({ ...formData, telegram_chat_id: e.target.value })}
                placeholder="Введите Chat ID для уведомлений"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Chat ID можно узнать в боте, нажав кнопку "🆔 Chat ID"
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm sm:text-base"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="w-full sm:flex-1 bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base"
              >
                Сохранить
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

