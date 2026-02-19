// ============================================
// Admin Promotions Page - Управление акциями (для супер-админа)
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Promotion, PromotionItem, getPromotions, createPromotion, updatePromotion, deletePromotion, getPromotionItems, addPromotionItems, getMenuItems } from '@/lib/api';
import { MenuItem } from '@/lib/types';
import ImageUpload from '@/components/ImageUpload';
import { handleApiError } from '@/lib/errorHandler';
import { useToast } from '@/contexts/ToastContext';

export default function AdminPromotionsPage() {
  const { showSuccess, showError } = useToast();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    discount_percent: 10,
    display_order: 0,
    is_active: true,
    selectedMenuItems: [] as string[], // IDs выбранных товаров
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenuItems, setLoadingMenuItems] = useState(false);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(null);
  const [promotionItems, setPromotionItems] = useState<PromotionItem[]>([]);

  useEffect(() => {
    async function fetchPromotions() {
      setLoading(true);
      try {
        const items = await getPromotions(true); // Получаем все, включая неактивные
        setPromotions(items);
      } catch (error) {
        console.error('Error fetching promotions:', error);
        showError(handleApiError(error));
      } finally {
        setLoading(false);
      }
    }
    fetchPromotions();
  }, [showError]);

  useEffect(() => {
    async function fetchAllMenuItems() {
      setLoadingMenuItems(true);
      try {
        // Получаем товары из всех магазинов
        const items = await getMenuItems(undefined, true);
        setMenuItems(items);
      } catch (error) {
        console.error('Error fetching menu items:', error);
        showError(handleApiError(error));
      } finally {
        setLoadingMenuItems(false);
      }
    }
    fetchAllMenuItems();
  }, [showError]);

  useEffect(() => {
    async function fetchPromotionItems() {
      if (!selectedPromotionId) {
        setPromotionItems([]);
        return;
      }
      try {
        const items = await getPromotionItems(selectedPromotionId);
        setPromotionItems(items);
      } catch (error) {
        console.error('Error fetching promotion items:', error);
        showError(handleApiError(error));
      }
    }
    fetchPromotionItems();
  }, [selectedPromotionId, showError]);

  const handleEdit = async (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setSelectedPromotionId(promotion.id);
    
    // Загружаем товары акции
    try {
      const items = await getPromotionItems(promotion.id);
      const itemIds = items.map(item => {
        // Проверяем вложенный объект menu_items (результат JOIN)
        if (item.menu_items && typeof item.menu_items === 'object' && item.menu_items.id) {
          return item.menu_items.id;
        }
        // Иначе берем menu_item_id напрямую
        return item.menu_item_id;
      });
      
      setFormData({
        name: promotion.name,
        description: promotion.description || '',
        image_url: promotion.image_url || '',
        discount_percent: promotion.discount_percent,
        display_order: promotion.display_order,
        is_active: promotion.is_active,
        selectedMenuItems: itemIds,
      });
    } catch (error) {
      console.error('Error loading promotion items:', error);
      setFormData({
        name: promotion.name,
        description: promotion.description || '',
        image_url: promotion.image_url || '',
        discount_percent: promotion.discount_percent,
        display_order: promotion.display_order,
        is_active: promotion.is_active,
        selectedMenuItems: [],
      });
    }
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту акцию?')) {
      return;
    }
    try {
      await deletePromotion(id);
      showSuccess('Акция успешно удалена');
      setPromotions(promotions.filter((promo) => promo.id !== id));
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError('Название акции обязательно');
      return;
    }

    if (formData.discount_percent < 1 || formData.discount_percent > 100) {
      showError('Процент скидки должен быть от 1 до 100');
      return;
    }

    try {
      let promotionId: string;
      
      if (editingPromotion) {
        // Обновляем акцию
        const updated = await updatePromotion(editingPromotion.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          image_url: formData.image_url || undefined,
          discount_percent: formData.discount_percent,
          display_order: formData.display_order,
          is_active: formData.is_active,
        });
        promotionId = updated.id;
        showSuccess('Акция успешно обновлена');
      } else {
        // Создаем акцию
        const created = await createPromotion({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          image_url: formData.image_url || undefined,
          discount_percent: formData.discount_percent,
          display_order: formData.display_order,
          is_active: formData.is_active,
        });
        promotionId = created.id;
        showSuccess('Акция успешно создана');
      }

      // Обновляем товары акции
      if (formData.selectedMenuItems.length > 0) {
        await addPromotionItems(promotionId, formData.selectedMenuItems);
      } else {
        // Если товары не выбраны, удаляем все существующие
        await addPromotionItems(promotionId, []);
      }

      // Обновляем список акций
      const updatedPromotions = await getPromotions(true);
      setPromotions(updatedPromotions);

      setShowForm(false);
      setEditingPromotion(null);
      setSelectedPromotionId(null);
      setFormData({
        name: '',
        description: '',
        image_url: '',
        discount_percent: 10,
        display_order: 0,
        is_active: true,
        selectedMenuItems: [],
      });
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  const handleNew = () => {
    setEditingPromotion(null);
    setSelectedPromotionId(null);
    setFormData({
      name: '',
      description: '',
      image_url: '',
      discount_percent: 10,
      display_order: 0,
      is_active: true,
      selectedMenuItems: [],
    });
    setShowForm(true);
  };

  const toggleMenuItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedMenuItems: prev.selectedMenuItems.includes(itemId)
        ? prev.selectedMenuItems.filter(id => id !== itemId)
        : [...prev.selectedMenuItems, itemId],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Управление акциями</h1>
          <p className="mt-2 text-sm text-gray-600">Создавайте и управляйте акциями со скидками</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка акций...</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <button
                onClick={handleNew}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                + Создать акцию
              </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Название
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Скидка
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
                  {promotions.map((promotion) => (
                    <tr key={promotion.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{promotion.name}</div>
                        {promotion.description && (
                          <div className="text-sm text-gray-500">{promotion.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-red-600">-{promotion.discount_percent}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{promotion.display_order}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            promotion.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {promotion.is_active ? 'Активна' : 'Неактивна'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(promotion)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDelete(promotion.id)}
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
          </>
        )}

        {/* Форма создания/редактирования */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-4xl w-full my-8">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {editingPromotion ? 'Редактировать акцию' : 'Создать акцию'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Название акции *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Описание
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Изображение акции
                    </label>
                    <ImageUpload
                      value={formData.image_url}
                      onChange={(url) => setFormData({ ...formData, image_url: url })}
                      folder="promotions"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Процент скидки * (1-100)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) || 10 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Порядок отображения
                    </label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      Активна
                    </label>
                  </div>

                  {/* Выбор товаров */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Товары в акции
                    </label>
                    {loadingMenuItems ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">Загрузка товаров...</p>
                      </div>
                    ) : (
                      <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
                        {menuItems.length === 0 ? (
                          <p className="text-sm text-gray-500">Товары не найдены</p>
                        ) : (
                          <div className="space-y-2">
                            {menuItems.map((item) => (
                              <label
                                key={item.id}
                                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.selectedMenuItems.includes(item.id)}
                                  onChange={() => toggleMenuItem(item.id)}
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-900">{item.name}</span>
                                <span className="text-sm text-gray-500">({item.price} so'm)</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingPromotion(null);
                        setSelectedPromotionId(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      {editingPromotion ? 'Сохранить' : 'Создать'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

