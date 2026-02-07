// ============================================
// Admin Stores Page - Управление магазинами
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Restaurant } from '@/lib/types';
import { getStores, createRestaurant, updateRestaurant, deleteRestaurant, getRestaurantAdmins, updateRestaurantAdmin } from '@/lib/api';
import ImageUpload from '@/components/ImageUpload';
import { handleApiError } from '@/lib/errorHandler';
import Pagination from '@/components/Pagination';
import { useToast } from '@/contexts/ToastContext';

export default function AdminStoresPage() {
  const { showSuccess, showError } = useToast();
  const [stores, setStores] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState<Restaurant | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const pageSize = 20;

  useEffect(() => {
    async function fetchStores() {
      try {
        setLoading(true);
        const result = await getStores(undefined, currentPage, pageSize);
        setStores(result.data);
        setPagination(result.pagination);
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
  }, [currentPage]);

  const handleEdit = async (store: Restaurant) => {
    setEditingStore(store);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот магазин?')) {
      try {
        await deleteRestaurant(id);
        setStores(stores.filter((s) => s.id !== id));
        showSuccess('Магазин успешно удален!');
      } catch (error) {
        console.error('Error deleting store:', error);
        showError(handleApiError(error));
      }
    }
  };

  const handleToggleActive = async (id: string) => {
    const store = stores.find((s) => s.id === id);
    if (!store) return;

    try {
      const updated = await updateRestaurant(id, {
        is_active: !store.is_active
      });
      setStores(stores.map((s) => (s.id === id ? updated : s)));
      showSuccess(`Магазин ${updated.is_active ? 'активирован' : 'деактивирован'}!`);
    } catch (error) {
      console.error('Error updating store:', error);
      showError(handleApiError(error));
    }
  };

  const handleSave = async (store: Restaurant) => {
    try {
      // Проверяем, редактируем ли мы существующий магазин
      const isEditing = editingStore && stores.some((s) => s.id === store.id);
      
      if (isEditing) {
        // Обновление существующего магазина
        const updated = await updateRestaurant(store.id, {
          name: store.name,
          description: store.description || undefined,
          phone: store.phone || undefined,
          image_url: store.image_url || undefined,
          delivery_text: store.delivery_text || undefined,
          is_active: store.is_active,
          is_featured: store.is_featured,
        });
        setStores(stores.map((s) => (s.id === store.id ? updated : s)));
        showSuccess('Магазин успешно обновлен!');
      } else {
        // Создание нового магазина
        const adminTelegramId = (store as any).admin_telegram_id;
        const adminPhone = (store as any).admin_phone;
        const adminPassword = (store as any).admin_password;
        const storeData: any = {
          name: store.name,
          description: store.description || undefined,
          phone: store.phone || undefined,
          image_url: store.image_url || undefined,
          delivery_text: store.delivery_text || 'Telegram-bot orqali buyurtma bering',
          is_active: store.is_active,
          is_featured: store.is_featured,
          type: 'store', // Указываем тип как магазин
        };
        
        // Добавляем admin_telegram_id только если он указан и не пустой
        if (adminTelegramId && adminTelegramId !== '' && !isNaN(Number(adminTelegramId))) {
          storeData.admin_telegram_id = Number(adminTelegramId);
        }
        
        // Добавляем admin_phone если указан
        if (adminPhone && adminPhone !== '') {
          storeData.admin_phone = adminPhone;
        }
        
        // Добавляем admin_password если указан
        if (adminPassword && adminPassword !== '') {
          storeData.admin_password = adminPassword;
        }
        
        console.log('Creating store with data:', storeData);
        const created = await createRestaurant(storeData);
        console.log('Store created successfully:', created);
        setStores([...stores, created]);
        showSuccess('Магазин успешно создан!');
      }
      setShowForm(false);
      setEditingStore(null);
    } catch (error: any) {
      console.error('Error saving store:', error);
      showError(handleApiError(error));
    }
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка магазинов...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🛒 Управление магазинами</h1>
        <button
          onClick={() => {
            setEditingStore(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto px-6 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base"
        >
          + Добавить магазин
        </button>
      </div>

      {/* Stores List - Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Изображение
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Название
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Описание
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Телефон
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stores.map((store) => (
              <tr key={store.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {store.image_url ? (
                    <img
                      src={store.image_url}
                      alt={store.name}
                      className="h-16 w-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      🛒
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{store.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 line-clamp-2 max-w-xs">
                    {store.description || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{store.phone || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(store.id)}
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      store.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {store.is_active ? 'Активен' : 'Неактивен'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(store)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDelete(store.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stores List - Mobile View */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {stores.map((store) => (
          <div key={store.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex gap-4 mb-3">
              {store.image_url ? (
                <img
                  src={store.image_url}
                  alt={store.name}
                  className="h-20 w-20 object-cover rounded-lg"
                />
              ) : (
                <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">
                  🛒
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{store.name}</h3>
                {store.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{store.description}</p>
                )}
                {store.phone && (
                  <p className="text-sm text-gray-500">📞 {store.phone}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-gray-200">
              <button
                onClick={() => handleEdit(store)}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm"
              >
                ✏️ Редактировать
              </button>
              <button
                onClick={() => handleDelete(store.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Store Form Modal */}
      {showForm && (
        <StoreFormModal
          store={editingStore}
          onClose={() => {
            setShowForm(false);
            setEditingStore(null);
          }}
          onSave={handleSave}
        />
      )}

      {pagination && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
          hasNext={pagination.hasNext}
        />
      )}
    </div>
  );
}

// Store Form Modal Component
function StoreFormModal({
  store,
  onClose,
  onSave,
}: {
  store: Restaurant | null;
  onClose: () => void;
  onSave: (store: Restaurant) => void;
}) {
  const [formData, setFormData] = useState({
    name: store?.name || '',
    description: store?.description || '',
    phone: store?.phone || '',
    image_url: store?.image_url || '',
    delivery_text: store?.delivery_text || 'Telegram-bot orqali buyurtma bering',
    is_active: store?.is_active ?? true,
    is_featured: store?.is_featured ?? false,
    admin_telegram_id: '', // Поле для Telegram ID админа (только при создании)
    admin_phone: '', // Поле для телефона админа
    admin_password: '', // Поле для пароля админа
  });
  
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // Обновляем formData при изменении store
  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        description: store.description || '',
        phone: store.phone || '',
        image_url: store.image_url || '',
        delivery_text: store.delivery_text || 'Telegram-bot orqali buyurtma bering',
        is_active: store.is_active ?? true,
        is_featured: store.is_featured ?? false,
        admin_telegram_id: '',
        admin_phone: '',
        admin_password: '',
      });
    }
  }, [store]);

  // Загружаем данные админа при редактировании
  useEffect(() => {
    async function loadAdmin() {
      if (store?.id) {
        try {
          setLoadingAdmin(true);
          const admins = await getRestaurantAdmins(store.id);
          if (admins && admins.length > 0) {
            const admin = admins[0];
            setFormData(prev => ({
              ...prev,
              admin_phone: admin.phone || '',
            }));
          }
        } catch (error) {
          console.error('Error loading admin:', error);
        } finally {
          setLoadingAdmin(false);
        }
      }
    }
    loadAdmin();
  }, [store?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newStore: Restaurant & { admin_telegram_id?: number } = {
      id: store?.id || '', // При создании оставляем пустым, сервер сгенерирует UUID
      name: formData.name,
      description: formData.description || null,
      phone: formData.phone || null,
      image_url: formData.image_url || null,
      delivery_text: formData.delivery_text || 'Telegram-bot orqali buyurtma bering',
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      working_hours: store?.working_hours || null,
      telegram_chat_id: store?.telegram_chat_id || null,
      created_at: store?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Добавляем admin_telegram_id, admin_phone, admin_password только при создании нового магазина
    if (!store) {
      if (formData.admin_telegram_id) {
        (newStore as any).admin_telegram_id = parseInt(formData.admin_telegram_id);
      }
      if (formData.admin_phone) {
        (newStore as any).admin_phone = formData.admin_phone;
      }
      if (formData.admin_password) {
        (newStore as any).admin_password = formData.admin_password;
      }
    } else {
      // При редактировании передаем данные админа
      if (formData.admin_phone !== undefined) {
        (newStore as any).admin_phone = formData.admin_phone;
      }
      if (formData.admin_password !== undefined) {
        (newStore as any).admin_password = formData.admin_password;
      }
    }

    onSave(newStore);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {store ? 'Редактировать магазин' : 'Добавить магазин'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название магазина *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Телефон
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="+998901234567"
              />
            </div>

            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              folder="stores"
              label="Изображение магазина"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Текст о доставке
              </label>
              <textarea
                value={formData.delivery_text}
                onChange={(e) => setFormData({ ...formData, delivery_text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                rows={2}
                placeholder="Telegram-bot orqali buyurtma bering"
              />
            </div>

            {!store && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telegram ID админа магазина (опционально)
                  </label>
                  <input
                    type="number"
                    value={formData.admin_telegram_id}
                    onChange={(e) => setFormData({ ...formData, admin_telegram_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="123456789"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Если указан, будет создан админ магазина с этим Telegram ID
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон админа (опционально)
                  </label>
                  <input
                    type="text"
                    value={formData.admin_phone}
                    onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+998901234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Пароль админа (опционально)
                  </label>
                  <input
                    type="password"
                    value={formData.admin_password}
                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Минимум 6 символов"
                  />
                </div>
              </>
            )}

            {store && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон админа
                  </label>
                  <input
                    type="text"
                    value={formData.admin_phone}
                    onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+998901234567"
                    disabled={loadingAdmin}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Новый пароль админа (оставьте пустым, чтобы не менять)
                  </label>
                  <input
                    type="password"
                    value={formData.admin_password}
                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Минимум 6 символов"
                  />
                </div>
              </>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                Активен
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="is_featured" className="ml-2 text-sm font-medium text-gray-700">
                Рекомендуемый
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
              >
                {store ? 'Сохранить изменения' : 'Создать магазин'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

