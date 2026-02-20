// ============================================
// Main Page Items Management - Управление товарами главной страницы
// ============================================

'use client';

import React, { useState, useEffect } from 'react';
import { MenuItem } from '@/lib/types';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, getAllStoreCategories, getMenuItemCategories } from '@/lib/api';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';
import { useAuth } from '@/contexts/AuthContext';
import { handleApiError } from '@/lib/errorHandler';
import { useToast } from '@/contexts/ToastContext';

export default function AdminMainPageItemsPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    async function fetchMenuItems() {
      try {
        // Получаем товары главной страницы
        const items = await getMenuItems(undefined, true, undefined, true);
        setMenuItems(items);
      } catch (error) {
        console.error('Error fetching main page items:', error);
        showError(handleApiError(error));
      } finally {
        setLoading(false);
      }
    }
    fetchMenuItems();
  }, [showError]);

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        await deleteMenuItem(id);
        setMenuItems((prevItems) => prevItems.filter((item) => item.id !== id));
        showSuccess('Товар успешно удален');
      } catch (error) {
        console.error('Error deleting menu item:', error);
        showError(handleApiError(error));
      }
    }
  };

  const handleToggleAvailable = async (id: string) => {
    const item = menuItems.find((i) => i.id === id);
    if (!item) return;

    const newAvailability = !item.is_available;
    
    // Оптимистичное обновление UI
    setMenuItems((prevItems) =>
      prevItems.map((i) =>
        i.id === id ? { ...i, is_available: newAvailability } : i
      )
    );

    try {
      await updateMenuItem(id, {
        is_available: newAvailability,
      });
      showSuccess('Статус товара обновлен');
    } catch (error: any) {
      // Откатываем изменения при ошибке
      setMenuItems((prevItems) =>
        prevItems.map((i) =>
          i.id === id ? { ...i, is_available: !newAvailability } : i
        )
      );
      console.error('Error toggling availability:', error);
      showError(handleApiError(error));
    }
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка товаров...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🏠 Товары главной страницы</h1>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base"
        >
          + Добавить товар
        </button>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {menuItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {item.image_url && (
              <div className="relative w-full h-32">
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">{item.name}</h3>
                  {!item.is_available && (
                    <p className="text-xs text-red-600 font-medium mt-1">Hoziq mavjud emas</p>
                  )}
                </div>
                <span className="text-base font-bold text-primary-600 ml-2 flex-shrink-0">
                  {item.discount_percent && item.discount_percent > 0 ? (
                    <>
                      <span className="text-red-600">{Math.round(item.price * (1 - item.discount_percent / 100))} so'm</span>
                      <span className="text-xs text-gray-500 line-through ml-1">{item.price} so'm</span>
                    </>
                  ) : (
                    `${item.price} so'm`
                  )}
                </span>
              </div>
              {item.description && (
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.description}</p>
              )}
              {item.category && (
                <p className="text-xs text-gray-500 mb-2">Категория: {item.category}</p>
              )}
              {item.discount_percent && item.discount_percent > 0 && (
                <div className="mb-2">
                  <span className="inline-block bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    -{item.discount_percent}%
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleToggleAvailable(item.id)}
                  className={`w-full px-2 py-1.5 rounded-lg text-xs font-semibold ${
                    item.is_available
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {item.is_available ? 'В наличии' : 'Нет в наличии'}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 px-2 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold hover:bg-blue-200"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 px-2 py-1.5 bg-red-100 text-red-800 rounded-lg text-xs font-semibold hover:bg-red-200"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {menuItems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Товары не найдены. Добавьте первый товар для главной страницы.
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <MenuItemFormModal
          item={editingItem}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSave={async (itemData) => {
            try {
              if (editingItem) {
                await updateMenuItem(editingItem.id, itemData);
                showSuccess('Товар успешно обновлен');
              } else {
                await createMenuItem({
                  ...itemData,
                  is_main_page: true, // Всегда true для товаров главной страницы
                  restaurant_id: null, // Товары главной страницы не привязаны к магазину
                });
                showSuccess('Товар успешно создан');
              }
              setShowForm(false);
              setEditingItem(null);
              // Обновляем список товаров
              const items = await getMenuItems(undefined, true, undefined, true);
              setMenuItems(items);
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

// Form Modal Component
interface MenuItemFormModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onSave: (itemData: any) => Promise<void>;
}

function MenuItemFormModal({ item, onClose, onSave }: MenuItemFormModalProps) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price?.toString() || '',
    category: item?.category || '',
    image_url: item?.image_url || '',
    is_available: item?.is_available ?? true,
    is_banner: item?.is_banner ?? false,
    discount_percent: item?.discount_percent?.toString() || '',
    selectedCategories: [] as string[], // Массив выбранных категорий
  });
  const [saving, setSaving] = useState(false);
  const [storeCategories, setStoreCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const categories = await getAllStoreCategories();
        setStoreCategories(categories);
      } catch (error) {
        console.error('Error fetching store categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  // Загружаем категории товара при редактировании
  useEffect(() => {
    async function fetchItemCategories() {
      if (item?.id) {
        try {
          const response = await fetch(`/api/menu-items/${item.id}/categories`);
          const result = await response.json();
          if (result.success && Array.isArray(result.data)) {
            setFormData(prev => ({ ...prev, selectedCategories: result.data }));
          }
        } catch (error) {
          console.error('Error fetching item categories:', error);
        }
      } else {
        // При создании нового товара очищаем выбранные категории
        setFormData(prev => ({ ...prev, selectedCategories: [] }));
      }
    }
    fetchItemCategories();
  }, [item?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        category: formData.category || null, // Для обратной совместимости
        categories: formData.selectedCategories, // Массив категорий
        image_url: formData.image_url || null,
        is_available: formData.is_available,
        is_banner: formData.is_banner,
        discount_percent: formData.discount_percent ? parseInt(formData.discount_percent) : null,
      });
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {item ? 'Изменить товар' : 'Добавить товар'}
          </h2>
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
                  Цена (so'm) *
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Скидка (%)
                </label>
                <input
                  type="number"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                  min="0"
                  max="100"
                  placeholder="0-100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Процент скидки (например: 50 для -50%)
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Категории
              </label>
              {loadingCategories ? (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                  Загрузка категорий...
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {storeCategories.filter(cat => cat.is_active).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Категории не найдены</p>
                  ) : (
                    <div className="space-y-2">
                      {storeCategories
                        .filter(cat => cat.is_active)
                        .map((category) => {
                          const isSelected = formData.selectedCategories.includes(category.name);
                          return (
                            <label
                              key={category.id}
                              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      selectedCategories: [...formData.selectedCategories, category.name],
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      selectedCategories: formData.selectedCategories.filter(
                                        (cat) => cat !== category.name
                                      ),
                                    });
                                  }
                                }}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-sm text-gray-900">{category.name}</span>
                            </label>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Выберите одну или несколько категорий из существующих категорий магазинов
              </p>
            </div>

            <div>
              <ImageUpload
                value={formData.image_url || ''}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                folder="menu"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">В наличии</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_banner}
                  onChange={(e) => setFormData({ ...formData, is_banner: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Баннер</span>
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : item ? 'Сохранить изменения' : 'Создать'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
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

