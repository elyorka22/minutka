// ============================================
// Admin Store Carousels Page - Управление каруселями магазинов (для супер-админа)
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { StoreCarousel, getStoreCarousels, createStoreCarousel, updateStoreCarousel, deleteStoreCarousel, getStoreCarouselItems, addStoreCarouselItems, removeStoreCarouselItem, getMenuItems, getStores } from '@/lib/api';
import { MenuItem, Restaurant } from '@/lib/types';
import { handleApiError } from '@/lib/errorHandler';
import { useToast } from '@/contexts/ToastContext';

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

export default function AdminStoreCarouselsPage() {
  const { showSuccess, showError } = useToast();
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [stores, setStores] = useState<Restaurant[]>([]);
  const [carousels, setCarousels] = useState<StoreCarousel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStores, setLoadingStores] = useState(true);
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
    async function fetchCarousels() {
      if (!selectedStoreId) {
        setLoading(false);
        setCarousels([]);
        return;
      }
      setLoading(true);
      try {
        const items = await getStoreCarousels(selectedStoreId, true);
        setCarousels(items);
      } catch (error) {
        console.error('Error fetching store carousels:', error);
        showError(handleApiError(error));
      } finally {
        setLoading(false);
      }
    }
    fetchCarousels();
  }, [selectedStoreId, showError]);

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
    
    // Загружаем товары и находим те, что уже привязаны к этой карусели
    setLoadingMenuItems(true);
    try {
      const items = await getMenuItems(selectedStoreId, true);
      setMenuItems(items);
      
      // Получаем товары карусели
      const carouselItemsData = await getStoreCarouselItems(carousel.id);
      const itemsInCarousel = carouselItemsData.map(item => item.menu_item_id);
      
      setFormData({
        name: carousel.name,
        display_order: carousel.display_order,
        is_active: carousel.is_active,
        selectedMenuItems: itemsInCarousel,
      });
    } catch (error) {
      console.error('Error loading menu items:', error);
      setFormData({
        name: carousel.name,
        display_order: carousel.display_order,
        is_active: carousel.is_active,
        selectedMenuItems: [],
      });
    } finally {
      setLoadingMenuItems(false);
    }
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту карусель?')) {
      return;
    }
    try {
      await deleteStoreCarousel(id);
      showSuccess('Карусель успешно удалена');
      setCarousels(carousels.filter((car) => car.id !== id));
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId || !formData.name.trim()) {
      showError('Название карусели обязательно');
      return;
    }

    try {
      let carouselId: string;
      
      if (editingCarousel) {
        // Обновляем карусель
        const updated = await updateStoreCarousel(editingCarousel.id, {
          name: formData.name.trim(),
          display_order: formData.display_order,
          is_active: formData.is_active,
        });
        carouselId = updated.id;
        showSuccess('Карусель успешно обновлена');
      } else {
        // Создаем карусель
        const created = await createStoreCarousel({
          restaurant_id: selectedStoreId,
          name: formData.name.trim(),
          display_order: formData.display_order,
          is_active: formData.is_active,
        });
        carouselId = created.id;
        showSuccess('Карусель успешно создана');
      }

      // Обновляем товары в карусели
      try {
        if (editingCarousel) {
          // При редактировании: получаем текущие товары и обновляем
          const currentItems = await getStoreCarouselItems(carouselId);
          const currentItemIds = new Set(currentItems.map(item => item.menu_item_id));
          const newItemIds = new Set(formData.selectedMenuItems);

          // Удаляем товары, которые были удалены
          const itemsToRemove = currentItems.filter(item => !newItemIds.has(item.menu_item_id));
          for (const item of itemsToRemove) {
            await removeStoreCarouselItem(carouselId, item.menu_item_id);
          }

          // Добавляем новые товары
          const itemsToAdd = formData.selectedMenuItems.filter(id => !currentItemIds.has(id));
          if (itemsToAdd.length > 0) {
            await addStoreCarouselItems(carouselId, itemsToAdd);
          }
        } else {
          // При создании: просто добавляем выбранные товары
          if (formData.selectedMenuItems.length > 0) {
            await addStoreCarouselItems(carouselId, formData.selectedMenuItems);
          }
        }

        if (formData.selectedMenuItems.length > 0) {
          showSuccess(`Карусель ${editingCarousel ? 'обновлена' : 'создана'}. Товаров в карусели: ${formData.selectedMenuItems.length}`);
        } else {
          showSuccess(`Карусель ${editingCarousel ? 'обновлена' : 'создана'}. Товары можно добавить позже.`);
        }
      } catch (error) {
        console.error('Error updating carousel items:', error);
        showError(`Карусель ${editingCarousel ? 'обновлена' : 'создана'}, но не удалось обновить товары: ${handleApiError(error)}`);
      }

      setShowForm(false);
      setEditingCarousel(null);
      setSelectedCarouselId(null);
      setFormData({
        name: '',
        display_order: 0,
        is_active: true,
        selectedMenuItems: [],
      });
      // Обновляем список
      const items = await getStoreCarousels(selectedStoreId, true);
      setCarousels(items);
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCarousel(null);
    setSelectedCarouselId(null);
    setFormData({
      name: '',
      display_order: 0,
      is_active: true,
      selectedMenuItems: [],
    });
    setMenuItems([]);
  };

  if (loadingStores) {
    return <div className="text-center py-12">Загрузка магазинов...</div>;
  }

  if (stores.length === 0) {
    return <div className="text-center py-12 text-gray-500">Нет доступных магазинов</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Карусели магазинов</h1>
        <div className="flex gap-4 items-center">
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
          {selectedStoreId && (
            <button
              onClick={async () => {
                setEditingCarousel(null);
                setSelectedCarouselId(null);
                
                // Загружаем товары при открытии формы создания
                setLoadingMenuItems(true);
                try {
                  const items = await getMenuItems(selectedStoreId, true);
                  setMenuItems(items);
                } catch (error) {
                  console.error('Error loading menu items:', error);
                } finally {
                  setLoadingMenuItems(false);
                }
                
                setFormData({
                  name: '',
                  display_order: carousels.length > 0 ? Math.max(...carousels.map(c => c.display_order)) + 1 : 0,
                  is_active: true,
                  selectedMenuItems: [],
                });
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Добавить карусель
            </button>
          )}
        </div>
      </div>

      {!selectedStoreId ? (
        <div className="text-center py-12 text-gray-500">
          Выберите магазин для управления каруселями
        </div>
      ) : (
        <>
          {showForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">
                {editingCarousel ? 'Редактировать карусель' : 'Создать карусель'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название карусели *
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
                    🛒 Привязать товары к карусели
                  </label>
                  {loadingMenuItems ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                      Загрузка товаров...
                    </div>
                  ) : menuItems.length === 0 ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                      Нет доступных товаров. Создайте товары в разделе "Меню"
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
                          </div>
                          <span className="text-sm text-gray-500">{item.price} so'm</span>
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Выберите товары, которые будут отображаться в этой карусели.
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
                    {editingCarousel ? 'Сохранить' : 'Создать'}
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

          {loading ? (
            <div className="text-center py-12">Загрузка каруселей...</div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {carousels.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Карусели пока не созданы для выбранного магазина</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                      {carousels
                        .sort((a, b) => a.display_order - b.display_order)
                        .map((carousel) => (
                          <CarouselRow 
                            key={carousel.id} 
                            carousel={carousel} 
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

