// ============================================
// Restaurant Admin Store Carousels Page - Управление каруселями магазина (для админа магазина)
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { StoreCarousel, getStoreCarousels, createStoreCarousel, updateStoreCarousel, deleteStoreCarousel, getStoreCarouselItems, addStoreCarouselItems, removeStoreCarouselItem, getMenuItems } from '@/lib/api';
import { MenuItem } from '@/lib/types';
import { handleApiError } from '@/lib/errorHandler';
import { useToast } from '@/contexts/ToastContext';
import { useRestaurantId } from '@/hooks/useRestaurantId';

// Компонент строки таблицы для загрузки количества товаров
function CarouselRow({ 
  carousel, 
  onEdit, 
  onDelete 
}: { 
  carousel: StoreCarousel; 
  onEdit: (carousel: StoreCarousel) => void;
  onDelete: (id: string) => void;
}) {
  const [itemsCount, setItemsCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCount() {
      try {
        const items = await getStoreCarouselItems(carousel.id);
        setItemsCount(items.length);
      } catch (error) {
        console.error('Error fetching carousel items count:', error);
      }
    }
    fetchCount();
  }, [carousel.id]);

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{carousel.name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{carousel.display_order}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{itemsCount !== null ? itemsCount : '...'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            carousel.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {carousel.is_active ? 'Активна' : 'Неактивна'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => onEdit(carousel)}
          className="text-blue-600 hover:text-blue-900 mr-4"
        >
          Редактировать
        </button>
        <button
          onClick={() => onDelete(carousel.id)}
          className="text-red-600 hover:text-red-900"
        >
          Удалить
        </button>
      </td>
    </tr>
  );
}

export default function RestaurantAdminStoreCarouselsPage() {
  const { showSuccess, showError } = useToast();
  const restaurantId = useRestaurantId();
  const [carousels, setCarousels] = useState<StoreCarousel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCarousel, setEditingCarousel] = useState<StoreCarousel | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    display_order: 0,
    is_active: true,
    selectedMenuItems: [] as string[], // IDs выбранных товаров
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenuItems, setLoadingMenuItems] = useState(false);
  const [selectedCarouselId, setSelectedCarouselId] = useState<string | null>(null);
  const [carouselItems, setCarouselItems] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCarousels() {
      if (!restaurantId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const items = await getStoreCarousels(restaurantId, true);
        setCarousels(items);
      } catch (error) {
        console.error('Error fetching store carousels:', error);
        showError(handleApiError(error));
      } finally {
        setLoading(false);
      }
    }
    fetchCarousels();
  }, [restaurantId, showError]);

  useEffect(() => {
    async function fetchMenuItems() {
      if (!restaurantId) return;
      try {
        setLoadingMenuItems(true);
        const items = await getMenuItems(restaurantId, true);
        setMenuItems(items);
      } catch (error) {
        console.error('Error fetching menu items:', error);
      } finally {
        setLoadingMenuItems(false);
      }
    }
    fetchMenuItems();
  }, [restaurantId]);

  useEffect(() => {
    async function fetchCarouselItems() {
      if (!selectedCarouselId) {
        setCarouselItems([]);
        return;
      }
      try {
        const items = await getStoreCarouselItems(selectedCarouselId);
        setCarouselItems(items);
      } catch (error) {
        console.error('Error fetching carousel items:', error);
      }
    }
    fetchCarouselItems();
  }, [selectedCarouselId]);

  const handleEdit = async (carousel: StoreCarousel) => {
    setEditingCarousel(carousel);
    setSelectedCarouselId(carousel.id);
    
    // Загружаем товары карусели
    try {
      const items = await getStoreCarouselItems(carousel.id);
      const itemIds = items.map(item => item.menu_item_id);
      setFormData({
        name: carousel.name,
        display_order: carousel.display_order,
        is_active: carousel.is_active,
        selectedMenuItems: itemIds,
      });
    } catch (error) {
      console.error('Error loading carousel items:', error);
      setFormData({
        name: carousel.name,
        display_order: carousel.display_order,
        is_active: carousel.is_active,
        selectedMenuItems: [],
      });
    }
    
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту карусель?')) {
      try {
        await deleteStoreCarousel(id);
        setCarousels(carousels.filter(c => c.id !== id));
        showSuccess('Карусель успешно удалена');
      } catch (error) {
        console.error('Error deleting carousel:', error);
        showError(handleApiError(error));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) {
      showError('Магазин не выбран');
      return;
    }

    try {
      if (editingCarousel) {
        // Обновление существующей карусели
        await updateStoreCarousel(editingCarousel.id, {
          name: formData.name,
          display_order: formData.display_order,
          is_active: formData.is_active,
        });

        // Обновляем товары в карусели
        const currentItems = await getStoreCarouselItems(editingCarousel.id);
        const currentItemIds = new Set(currentItems.map(item => item.menu_item_id));
        const newItemIds = new Set(formData.selectedMenuItems);

        // Удаляем товары, которые были удалены
        const itemsToRemove = currentItems.filter(item => !newItemIds.has(item.menu_item_id));
        for (const item of itemsToRemove) {
          await removeStoreCarouselItem(editingCarousel.id, item.menu_item_id);
        }

        // Добавляем новые товары
        const itemsToAdd = formData.selectedMenuItems.filter(id => !currentItemIds.has(id));
        if (itemsToAdd.length > 0) {
          await addStoreCarouselItems(editingCarousel.id, itemsToAdd);
        }

        showSuccess('Карусель успешно обновлена');
      } else {
        // Создание новой карусели
        const newCarousel = await createStoreCarousel({
          restaurant_id: restaurantId,
          name: formData.name,
          display_order: formData.display_order,
          is_active: formData.is_active,
        });

        // Добавляем товары в карусель
        if (formData.selectedMenuItems.length > 0) {
          await addStoreCarouselItems(newCarousel.id, formData.selectedMenuItems);
        }

        showSuccess('Карусель успешно создана');
      }

      // Обновляем список каруселей
      const items = await getStoreCarousels(restaurantId, true);
      setCarousels(items);
      setShowForm(false);
      setEditingCarousel(null);
      setSelectedCarouselId(null);
      setFormData({
        name: '',
        display_order: 0,
        is_active: true,
        selectedMenuItems: [],
      });
    } catch (error) {
      console.error('Error saving carousel:', error);
      showError(handleApiError(error));
    }
  };

  if (!restaurantId) {
    return <div className="text-center py-12">Магазин не выбран</div>;
  }

  if (loading) {
    return <div className="text-center py-12">Загрузка каруселей...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🎠 Карусели магазина</h1>
        <button
          onClick={() => {
            setEditingCarousel(null);
            setSelectedCarouselId(null);
            setFormData({
              name: '',
              display_order: 0,
              is_active: true,
              selectedMenuItems: [],
            });
            setShowForm(true);
          }}
          className="w-full sm:w-auto bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base"
        >
          + Создать карусель
        </button>
      </div>

      {/* Таблица каруселей */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Название
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Порядок
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Товаров
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
            {carousels.map((carousel) => (
              <CarouselRow
                key={carousel.id}
                carousel={carousel}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </tbody>
        </table>

        {carousels.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Карусели не найдены. Создайте первую карусель.
          </div>
        )}
      </div>

      {/* Форма создания/редактирования */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingCarousel ? 'Редактировать карусель' : 'Создать карусель'}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Порядок отображения
                    </label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Статус
                    </label>
                    <select
                      value={formData.is_active ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="true">Активна</option>
                      <option value="false">Неактивна</option>
                    </select>
                  </div>
                </div>

                {/* Выбор товаров */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Товары в карусели
                  </label>
                  {loadingMenuItems ? (
                    <div className="text-center py-4 text-gray-500">Загрузка товаров...</div>
                  ) : (
                    <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                      {menuItems.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">Товары не найдены</div>
                      ) : (
                        <div className="space-y-2">
                          {menuItems.map((item) => {
                            const isSelected = formData.selectedMenuItems.includes(item.id);
                            const isInCarousel = carouselItems.some(ci => ci.menu_item_id === item.id);
                            const shouldBeChecked = editingCarousel ? isInCarousel : isSelected;
                            
                            return (
                              <label key={item.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                  type="checkbox"
                                  checked={shouldBeChecked}
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
                                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-900">{item.name}</span>
                                <span className="text-xs text-gray-500">({item.price} so'm)</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
                  >
                    {editingCarousel ? 'Сохранить изменения' : 'Создать'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingCarousel(null);
                      setSelectedCarouselId(null);
                      setFormData({
                        name: '',
                        display_order: 0,
                        is_active: true,
                        selectedMenuItems: [],
                      });
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

