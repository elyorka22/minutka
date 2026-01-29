// ============================================
// Restaurant Admin - Manage Admins Page
// Управление админами ресторана (доступно только поварам)
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { RestaurantAdmin } from '@/lib/types';
import { getRestaurantAdmins, createRestaurantAdmin, updateRestaurantAdmin, deleteRestaurantAdmin } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurantId } from '@/hooks/useRestaurantId';
import { handleApiError } from '@/lib/errorHandler';

export default function RestaurantAdminAdminsPage() {
  const { user } = useAuth();
  const currentRestaurantId = useRestaurantId();
  const [admins, setAdmins] = useState<RestaurantAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<RestaurantAdmin | null>(null);

  useEffect(() => {
    async function fetchAdmins() {
      try {
        const data = await getRestaurantAdmins(currentRestaurantId);
        setAdmins(data);
      } catch (error) {
        console.error('Error fetching admins:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAdmins();
  }, [currentRestaurantId]);

  const handleEdit = (admin: RestaurantAdmin) => {
    setEditingAdmin(admin);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этого админа?')) {
      try {
        await deleteRestaurantAdmin(id);
        setAdmins(admins.filter((a) => a.id !== id));
      } catch (error) {
        console.error('Error deleting admin:', error);
        alert(handleApiError(error));
      }
    }
  };

  const handleSave = async (admin: RestaurantAdmin) => {
    if (!currentRestaurantId) {
      alert('Ошибка: не удалось определить ресторан');
      return;
    }

    try {
      if (admin.id && admin.id !== Date.now().toString()) {
        // Обновление существующего админа
        const updated = await updateRestaurantAdmin(admin.id, {
          username: admin.username,
          first_name: admin.first_name,
          last_name: admin.last_name,
          phone: admin.phone,
          is_active: admin.is_active,
        });
        setAdmins(admins.map((a) => (a.id === admin.id ? updated : a)));
      } else {
        // Создание нового админа
        const adminData: any = {
          restaurant_id: currentRestaurantId,
          telegram_id: admin.telegram_id,
          username: admin.username,
          first_name: admin.first_name,
          last_name: admin.last_name,
          is_active: admin.is_active,
        };
        // Добавляем phone если он есть
        if (admin.phone) {
          adminData.phone = admin.phone;
        }
        // Добавляем пароль если он есть
        if ((admin as any).password) {
          adminData.password = (admin as any).password;
        }
        const created = await createRestaurantAdmin(adminData);
        setAdmins([...admins, created]);
      }
      setShowForm(false);
      setEditingAdmin(null);
    } catch (error) {
      console.error('Error saving admin:', error);
      alert(handleApiError(error));
    }
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка админов...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">👤 Управление админами</h1>
          <p className="text-sm text-gray-600 mt-2">
            Создавайте и управляйте админами для вашего ресторана. Админы имеют полный доступ к управлению рестораном.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingAdmin(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base"
        >
          + Добавить админа
        </button>
      </div>

      {/* Admins Cards */}
      <div className="space-y-4">
        {admins.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            <p className="mb-4">Админы не найдены</p>
            <button
              onClick={() => {
                setEditingAdmin(null);
                setShowForm(true);
              }}
              className="bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
            >
              + Создать первого админа
            </button>
          </div>
        ) : (
          admins.map((admin) => (
            <div key={admin.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {admin.first_name} {admin.last_name}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    {admin.username && (
                      <p>👤 @{admin.username}</p>
                    )}
                    <p>🆔 Telegram ID: {admin.telegram_id}</p>
                    <p className="text-xs text-gray-500">
                      📅 Создан: {new Date(admin.created_at).toLocaleDateString('ru-RU')}
                    </p>
                    <div className="mt-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          admin.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {admin.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleEdit(admin)}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm"
                  >
                    ✏️ Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(admin.id)}
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

      {/* Admin Form Modal */}
      {showForm && (
        <AdminFormModal
          admin={editingAdmin}
          onClose={() => {
            setShowForm(false);
            setEditingAdmin(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// Admin Form Modal Component
function AdminFormModal({
  admin,
  onClose,
  onSave,
}: {
  admin: RestaurantAdmin | null;
  onClose: () => void;
  onSave: (admin: RestaurantAdmin) => void;
}) {
  const [formData, setFormData] = useState({
    telegram_id: admin?.telegram_id?.toString() || '',
    username: admin?.username || '',
    first_name: admin?.first_name || '',
    last_name: admin?.last_name || '',
    phone: admin?.phone || '',
    is_active: admin?.is_active ?? true,
    password: '', // Пароль только при создании
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.telegram_id) {
      alert('Пожалуйста, укажите Telegram ID');
      return;
    }
    if (!admin && !formData.password) {
      alert('Пожалуйста, укажите пароль для нового админа');
      return;
    }

    const newAdmin: Omit<RestaurantAdmin, 'phone' | 'password'> & { phone?: string; password?: string } = {
      id: admin?.id || Date.now().toString(),
      restaurant_id: admin?.restaurant_id || '', // Будет установлен в handleSave
      telegram_id: parseInt(formData.telegram_id),
      username: formData.username || null,
      first_name: formData.first_name || null,
      last_name: formData.last_name || null,
      is_active: formData.is_active,
      notifications_enabled: admin?.notifications_enabled ?? true,
      created_at: admin?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    // Добавляем phone и password если они указаны
    if (formData.phone) {
      (newAdmin as any).phone = formData.phone;
    }
    // Добавляем пароль только при создании нового админа
    if (!admin && formData.password) {
      (newAdmin as any).password = formData.password;
    }
    onSave(newAdmin as RestaurantAdmin);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {admin ? 'Редактировать админа' : 'Добавить админа'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl flex-shrink-0">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telegram ID *
              </label>
              <input
                type="number"
                value={formData.telegram_id}
                onChange={(e) => setFormData({ ...formData, telegram_id: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="username"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Фамилия
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Телефон админа
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Введите телефон админа"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2 w-4 h-4"
                />
                <span className="text-sm text-gray-700">Активен</span>
              </label>
            </div>

            {!admin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parol (Пароль) *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!admin}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Введите пароль для админа"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Пароль будет использоваться для входа в систему
                </p>
              </div>
            )}

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


