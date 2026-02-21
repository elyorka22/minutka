// ============================================
// Admin Categories Page - Управление категориями главной страницы (для супер-админа)
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { StoreCategory, getAllStoreCategories, createStoreCategory, updateStoreCategory, deleteStoreCategory, getMenuItems, updateMenuItem, getStores } from '@/lib/api';
import { MenuItem, Restaurant } from '@/lib/types';
import ImageUpload from '@/components/ImageUpload';
import { handleApiError } from '@/lib/errorHandler';
import { useToast } from '@/contexts/ToastContext';

export default function AdminCategoriesPage() {
  const { showSuccess, showError } = useToast();
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [stores, setStores] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStores, setLoadingStores] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    display_order: 0,
    is_active: true,
    selectedMenuItems: [] as string[], // IDs выбранных товаров
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenuItems, setLoadingMenuItems] = useState(false);

  useEffect(() => {
    async function fetchStores() {
      try {
        const result = await getStores();
        const storeList = result.data.filter((s: Restaurant) => s.type === 'store');
        setStores(storeList);
        if (storeList.length > 0 && !selectedStoreId) {
          setSelectedStoreId(storeList[0].id);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
        showError(handleApiError(error));
      } finally {
        setLoadingStores(false);
      }
    }
    fetchStores();
  }, [showError]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        console.log('[AdminCategories] Fetching all store categories...');
        const allCategories = await getAllStoreCategories(true);
        console.log('[AdminCategories] Fetched categories:', allCategories.length, allCategories);
        setCategories(allCategories);
      } catch (error) {
        console.error('Error fetching store categories:', error);
        showError(handleApiError(error));
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, [showError]);

  const handleEdit = async (category: StoreCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || '',
      display_order: category.display_order,
      is_active: category.is_active,
      selectedMenuItems: [],
    });

    // Загружаем товары для выбранного магазина (если есть) или всех магазинов
    setLoadingMenuItems(true);
    try {
      if (selectedStoreId) {
        const items = await getMenuItems(selectedStoreId, true);
        setMenuItems(items);
        // Предзаполняем выбранные товары, которые уже привязаны к этой категории
        const itemsInCategory = items.filter(item => item.category === category.name);
        setFormData(prev => ({
          ...prev,
          selectedMenuItems: itemsInCategory.map(item => item.id),
        }));
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      setLoadingMenuItems(false);
    }

    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) {
      return;
    }
    try {
      await deleteStoreCategory(id);
      // Перезагружаем список категорий после удаления
      const updatedCategories = await getAllStoreCategories(true);
      setCategories(updatedCategories);
      showSuccess('Категория успешно удалена');
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError('Название категории обязательно');
      return;
    }

    // Для создания категории нужен restaurant_id - используем первый магазин или выбранный
    if (!selectedStoreId && stores.length === 0) {
      showError('Нужно выбрать магазин для создания категории');
      return;
    }

    const storeIdToUse = selectedStoreId || stores[0]?.id;
    if (!storeIdToUse) {
      showError('Нет доступных магазинов');
      return;
    }

    try {
      let categoryId: string;
      const categoryName = formData.name.trim();
      
      if (editingCategory) {
        // Обновляем категорию
        const updated = await updateStoreCategory(editingCategory.id, {
          name: categoryName,
          description: formData.description.trim() || undefined,
          image_url: formData.image_url || undefined,
          display_order: formData.display_order,
          is_active: formData.is_active,
        });
        categoryId = updated.id;
        showSuccess('Категория успешно обновлена');
      } else {
        // Создаем категорию
        const created = await createStoreCategory({
          restaurant_id: storeIdToUse,
          name: categoryName,
          description: formData.description.trim() || undefined,
          image_url: formData.image_url || undefined,
          display_order: formData.display_order,
          is_active: formData.is_active,
        });
        categoryId = created.id;
        showSuccess('Категория успешно создана');
      }

      // Обновляем категорию у выбранных товаров
      if (formData.selectedMenuItems.length > 0 && selectedStoreId) {
        try {
          // Сначала убираем категорию у всех товаров, которые были в старой категории (если редактируем)
          if (editingCategory) {
            const itemsToUnlink = menuItems.filter(
              item => item.category === editingCategory.name && !formData.selectedMenuItems.includes(item.id)
            );
            for (const item of itemsToUnlink) {
              await updateMenuItem(item.id, { category: null });
            }
          }

          // Привязываем выбранные товары к категории
          for (const itemId of formData.selectedMenuItems) {
            await updateMenuItem(itemId, { category: categoryName });
          }
          
          if (formData.selectedMenuItems.length > 0) {
            showSuccess(`Категория обновлена. Привязано товаров: ${formData.selectedMenuItems.length}`);
          }
        } catch (error) {
          console.error('Error updating menu items:', error);
          showError('Категория создана, но не удалось привязать товары');
        }
      }

      setShowForm(false);
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        image_url: '',
        display_order: 0,
        is_active: true,
        selectedMenuItems: [],
      });
      setMenuItems([]);
      
      // Перезагружаем список категорий
      const updatedCategories = await getAllStoreCategories(true);
      setCategories(updatedCategories);
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      image_url: '',
      display_order: 0,
      is_active: true,
      selectedMenuItems: [],
    });
    setMenuItems([]);
  };

  const handleImageUpload = (url: string) => {
    setFormData({ ...formData, image_url: url });
  };

  // Загружаем товары при выборе магазина
  useEffect(() => {
    async function loadMenuItems() {
      if (!selectedStoreId || !showForm) return;
      try {
        setLoadingMenuItems(true);
        const items = await getMenuItems(selectedStoreId, true);
        setMenuItems(items);
        // Если редактируем категорию, предзаполняем выбранные товары
        if (editingCategory) {
          const itemsInCategory = items.filter(item => item.category === editingCategory.name);
          setFormData(prev => ({
            ...prev,
            selectedMenuItems: itemsInCategory.map(item => item.id),
          }));
        }
      } catch (error) {
        console.error('Error loading menu items:', error);
      } finally {
        setLoadingMenuItems(false);
      }
    }
    loadMenuItems();
  }, [selectedStoreId, showForm, editingCategory]);

  if (loading || loadingStores) {
    return <div className="text-center py-12">Загрузка...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Категории главной страницы</h1>
        <button
          onClick={async () => {
            setEditingCategory(null);
            
            // Выбираем первый магазин, если не выбран
            if (!selectedStoreId && stores.length > 0) {
              setSelectedStoreId(stores[0].id);
            }
            
            // Загружаем товары при открытии формы создания
            if (selectedStoreId || stores.length > 0) {
              const storeId = selectedStoreId || stores[0].id;
              setLoadingMenuItems(true);
              try {
                const items = await getMenuItems(storeId, true);
                setMenuItems(items);
              } catch (error) {
                console.error('Error loading menu items:', error);
              } finally {
                setLoadingMenuItems(false);
              }
            }
            
            setFormData({
              name: '',
              description: '',
              image_url: '',
              display_order: categories.length > 0 ? Math.max(...categories.map(c => c.display_order)) + 1 : 0,
              is_active: true,
              selectedMenuItems: [],
            });
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Добавить категорию
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingCategory ? 'Редактировать категорию' : 'Создать категорию'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Выбор магазина для привязки товаров */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Магазин (для привязки товаров)
              </label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- Выберите магазин --</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Выберите магазин, товары которого будут привязаны к категории
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название категории *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div>
              <ImageUpload
                value={formData.image_url}
                onChange={handleImageUpload}
                folder="store-categories"
                label="Изображение"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Порядок отображения
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Меньшее число = выше в списке</p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Активна
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🛒 Привязать товары к категории
              </label>
              {!selectedStoreId ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                  Выберите магазин для загрузки товаров
                </div>
              ) : loadingMenuItems ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                  Загрузка товаров...
                </div>
              ) : menuItems.length === 0 ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                  Нет доступных товаров. Создайте товары в разделе "Меню" магазина
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-3 max-h-60 overflow-y-auto bg-white">
                  {menuItems.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center py-2 px-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedMenuItems.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              selectedMenuItems: [...formData.selectedMenuItems, item.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              selectedMenuItems: formData.selectedMenuItems.filter(id => id !== item.id),
                            });
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{item.name}</span>
                        {item.category && item.category !== formData.name && (
                          <span className="text-xs text-orange-600 ml-2">
                            (текущая категория: {item.category})
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{item.price} so'm</span>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Выберите товары, которые будут отображаться в этой категории. Выбранные товары будут автоматически привязаны к категории при сохранении.
              </p>
              {formData.selectedMenuItems.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Выбрано товаров: {formData.selectedMenuItems.length}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {editingCategory ? 'Сохранить' : 'Создать'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Категории пока не созданы</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
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
                    Порядок
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((category) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="h-16 w-16 object-cover rounded"
                          />
                        ) : (
                          <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                            Нет фото
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {category.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{category.display_order}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            category.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {category.is_active ? 'Активна' : 'Неактивна'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
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
        )}
      </div>
    </div>
  );
}

