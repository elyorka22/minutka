// ============================================
// Admin Super Admins Page - Управление супер-админами
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { SuperAdmin } from '@/lib/types';
import { getSuperAdmins, createSuperAdmin, updateSuperAdmin, deleteSuperAdmin } from '@/lib/api';

export default function AdminSuperAdminsPage() {
  const [admins, setAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<SuperAdmin | null>(null);

  useEffect(() => {
    async function fetchAdmins() {
      try {
        const data = await getSuperAdmins();
        setAdmins(data);
      } catch (error) {
        console.error('Error fetching super admins:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAdmins();
  }, []);

  const handleEdit = (admin: SuperAdmin) => {
    setEditingAdmin(admin);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этого супер-админа?')) {
      try {
        await deleteSuperAdmin(id);
        setAdmins(admins.filter((a) => a.id !== id));
      } catch (error) {
        console.error('Error deleting super admin:', error);
        alert('Ошибка при удалении супер-админа');
      }
    }
  };

  const handleSave = async (admin: SuperAdmin) => {
    try {
      if (admin.id && admin.id !== Date.now().toString()) {
        // Обновление существующего админа
        const adminData: any = {
          username: admin.username,
          first_name: admin.first_name,
          last_name: admin.last_name,
          is_active: admin.is_active,
        };
        // Добавляем пароль если он есть (для изменения пароля)
        if ((admin as any).password) {
          adminData.password = (admin as any).password;
        }
        const updated = await updateSuperAdmin(admin.id, adminData);
        setAdmins(admins.map((a) => (a.id === admin.id ? updated : a)));
      } else {
        // Создание нового админа
        const adminData: any = {
          telegram_id: admin.telegram_id,
          username: admin.username,
          first_name: admin.first_name,
          last_name: admin.last_name,
          is_active: admin.is_active,
        };
        // Добавляем пароль если он есть
        if ((admin as any).password) {
          adminData.password = (admin as any).password;
        }
        const created = await createSuperAdmin(adminData);
        setAdmins([...admins, created]);
      }
      setShowForm(false);
      setEditingAdmin(null);
    } catch (error) {
      console.error('Error saving super admin:', error);
      alert('Ошибка при сохранении супер-админа');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка супер-админов...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🛡️ Управление супер-админами</h1>
        <button
          onClick={() => {
            setEditingAdmin(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base"
        >
          + Добавить супер-админа
        </button>
      </div>

      {/* Admins Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Имя
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telegram ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата создания
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {admin.first_name} {admin.last_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {admin.username ? `@${admin.username}` : '—'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {admin.telegram_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      admin.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {admin.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(admin.created_at).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(admin)}
                    className="text-primary-600 hover:text-primary-900 mr-4"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(admin.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Admins Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {admins.map((admin) => (
          <div key={admin.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {admin.first_name} {admin.last_name}
              </h3>
              <div className="space-y-1 text-sm">
                {admin.username && (
                  <p className="text-gray-600">👤 @{admin.username}</p>
                )}
                <p className="text-gray-500">🆔 {admin.telegram_id}</p>
                <p className="text-gray-500 text-xs">
                  📅 {new Date(admin.created_at).toLocaleDateString('ru-RU')}
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
            <div className="flex gap-2 pt-3 border-t border-gray-200">
              <button
                onClick={() => handleEdit(admin)}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm"
              >
                ✏️ Редактировать
              </button>
              <button
                onClick={() => handleDelete(admin.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
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
  admin: SuperAdmin | null;
  onClose: () => void;
  onSave: (admin: SuperAdmin) => void;
}) {
  const [formData, setFormData] = useState({
    telegram_id: admin?.telegram_id?.toString() || '',
    username: admin?.username || '',
    first_name: admin?.first_name || '',
    last_name: admin?.last_name || '',
    password: '', // Пароль для создания или изменения
    is_active: admin?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.telegram_id) {
      alert('Пожалуйста, укажите Telegram ID');
      return;
    }
    if (!admin && !formData.password) {
      alert('Пожалуйста, укажите пароль для нового супер-админа');
      return;
    }

    const newAdmin: Omit<SuperAdmin, 'password'> & { password?: string } = {
      id: admin?.id || Date.now().toString(),
      telegram_id: parseInt(formData.telegram_id),
      username: formData.username || null,
      first_name: formData.first_name || null,
      last_name: formData.last_name || null,
      is_active: formData.is_active,
      created_at: admin?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    // Добавляем пароль если он указан
    if (formData.password) {
      (newAdmin as any).password = formData.password;
    }
    onSave(newAdmin as SuperAdmin);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {admin ? 'Редактировать супер-админа' : 'Добавить супер-админа'}
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
                disabled={!!admin}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="123456789"
              />
              <p className="mt-1 text-xs text-gray-500">
                {admin ? 'Telegram ID нельзя изменить' : 'ID пользователя в Telegram'}
              </p>
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
                {admin ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Parol (Пароль) *'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!admin}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={admin ? 'Введите новый пароль или оставьте пустым' : 'Введите пароль для супер-админа'}
              />
              <p className="mt-1 text-xs text-gray-500">
                {admin ? 'Оставьте пустым, чтобы не менять пароль' : 'Пароль будет использоваться для входа в систему'}
              </p>
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

