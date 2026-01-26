// ============================================
// Restaurant Admin Menu Page - Управление меню ресторана
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { MenuItem } from '@/lib/types';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '@/lib/api';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';
import { useAuth } from '@/contexts/AuthContext';
import { handleApiError } from '@/lib/errorHandler';
import { useToast } from '@/contexts/ToastContext';

export default function RestaurantAdminMenuPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  // Получаем restaurant_id из данных пользователя
  const currentRestaurantId = (user?.user as any)?.restaurant_id;
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    async function fetchMenuItems() {
      if (!currentRestaurantId) {
        setLoading(false);
        return;
      }
      try {
        // В админ-панели показываем все блюда, включая недоступные
        const items = await getMenuItems(currentRestaurantId, true);
        setMenuItems(items);
      } catch (error) {
        console.error('Error fetching menu items:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchMenuItems();
  }, [currentRestaurantId]);

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот пункт меню?')) {
      try {
        await deleteMenuItem(id);
        setMenuItems(menuItems.filter((item) => item.id !== id));
      } catch (error) {
        console.error('Error deleting menu item:', error);
        showError(handleApiError(error));
      }
    }
  };

  const handleToggleAvailable = (id: string) => {
    setMenuItems(
      menuItems.map((item) =>
        item.id === id ? { ...item, is_available: !item.is_available } : item
      )
    );
  };

  const filteredItems = menuItems;

  if (loading) {
    return <div className="text-center py-12">Загрузка меню...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🍽️ Управление меню</h1>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base"
        >
          + Добавить блюдо
        </button>
      </div>


      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {item.image_url && (
              <div className="relative w-full h-48">
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                </div>
                <span className="text-lg font-bold text-primary-600">{item.price} сум</span>
              </div>
              {item.description && (
                <p className="text-sm text-gray-600 mb-3">{item.description}</p>
              )}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  onClick={() => handleToggleAvailable(item.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold ${
                    item.is_available
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {item.is_available ? 'В наличии' : 'Нет в наличии'}
                </button>
                <button
                  onClick={() => handleEdit(item)}
                  className="px-3 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm font-semibold hover:bg-primary-200"
                >
                  ✏️ Редактировать
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-md">
          Блюд в выбранной категории не найдено
        </div>
      )}

      {/* Menu Item Form Modal */}
      {showForm && (
        <MenuItemFormModal
          item={editingItem}
          restaurantId={currentRestaurantId}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSave={async (item) => {
            try {
              if (editingItem) {
                // Обновление существующего блюда
                const updated = await updateMenuItem(item.id, {
                  name: item.name,
                  description: item.description,
                  price: item.price,
                  category: item.category,
                  image_url: item.image_url,
                  is_available: item.is_available,
                });
                setMenuItems(menuItems.map((i) => (i.id === item.id ? updated : i)));
                showSuccess('Блюдо успешно обновлено!');
              } else {
                // Создание нового блюда
                if (!currentRestaurantId) {
                  showError('Ошибка: не удалось определить ресторан');
                  return;
                }
                const created = await createMenuItem({
                  restaurant_id: currentRestaurantId,
                  name: item.name,
                  description: item.description,
                  price: item.price,
                  category: item.category,
                  image_url: item.image_url,
                  is_available: item.is_available,
                });
                setMenuItems([...menuItems, created]);
                showSuccess('Блюдо успешно создано!');
              }
              setShowForm(false);
              setEditingItem(null);
            } catch (error) {
              console.error('Error saving menu item:', error);
              showError(handleApiError(error));
            }
          }}
        />
      )}
    </div>
  );
}

// Menu Item Form Modal Component
function MenuItemFormModal({
  item,
  restaurantId,
  onClose,
  onSave,
}: {
  item: MenuItem | null;
  restaurantId: string | undefined;
  onClose: () => void;
  onSave: (item: MenuItem) => void;
}) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price?.toString() || '',
    image_url: item?.image_url || '',
    is_available: item?.is_available ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: MenuItem = {
      id: item?.id || Date.now().toString(),
      restaurant_id: item?.restaurant_id || restaurantId || '',
      name: formData.name,
      description: formData.description || null,
      price: parseInt(formData.price),
      category: null, // Категория не используется для блюд ресторана
      image_url: formData.image_url || null,
      is_available: formData.is_available,
      created_at: item?.created_at || new Date().toISOString(),
    };
    onSave(newItem);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {item ? 'Редактировать блюдо' : 'Добавить блюдо'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl flex-shrink-0">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Цена (сум) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <ImageUpload
              value={formData.image_url || ''}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              folder="menu"
              label="Изображение блюда"
              required={false}
            />

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">В наличии</span>
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

