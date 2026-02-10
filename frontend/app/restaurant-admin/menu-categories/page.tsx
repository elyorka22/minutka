// ============================================
// Restaurant Admin Menu Categories Page - Управление категориями меню
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { MenuCategory, getMenuCategories, createMenuCategory, updateMenuCategory, deleteMenuCategory } from '@/lib/api';
import ImageUpload from '@/components/ImageUpload';
import { useRestaurantId } from '@/hooks/useRestaurantId';
import { handleApiError } from '@/lib/errorHandler';
import { useToast } from '@/contexts/ToastContext';

export default function RestaurantAdminMenuCategoriesPage() {
  const { showSuccess, showError } = useToast();
  const currentRestaurantId = useRestaurantId();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    async function fetchCategories() {
      if (!currentRestaurantId) {
        setLoading(false);
        return;
      }
      try {
        const items = await getMenuCategories(currentRestaurantId!, true);
        setCategories(items);
      } catch (error) {
        console.error('Error fetching menu categories:', error);
        showError(handleApiError(error));
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, [currentRestaurantId, showError]);

  const handleEdit = (category: MenuCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || '',
      display_order: category.display_order,
      is_active: category.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) {
      return;
    }
    try {
      await deleteMenuCategory(id);
      showSuccess('Категория успешно удалена');
      setCategories(categories.filter((cat) => cat.id !== id));
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurantId || !formData.name.trim()) {
      showError('Название категории обязательно');
      return;
    }

    try {
      if (editingCategory) {
        await updateMenuCategory(editingCategory.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          image_url: formData.image_url || undefined,
          display_order: formData.display_order,
          is_active: formData.is_active,
        });
        showSuccess('Категория успешно обновлена');
      } else {
        await createMenuCategory({
          restaurant_id: currentRestaurantId,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          image_url: formData.image_url || undefined,
          display_order: formData.display_order,
          is_active: formData.is_active,
        });
        showSuccess('Категория успешно создана');
      }
      setShowForm(false);
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        image_url: '',
        display_order: 0,
        is_active: true,
      });
      // Обновляем список
      const items = await getMenuCategories(currentRestaurantId!, true);
      setCategories(items);
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
    });
  };

  const handleImageUpload = (url: string) => {
    setFormData({ ...formData, image_url: url });
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка...</div>;
  }

  if (!currentRestaurantId) {
    return <div className="text-center py-12 text-red-600">Ресторан не выбран</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Категории меню</h1>
        <button
          onClick={() => {
            setEditingCategory(null);
            setFormData({
              name: '',
              description: '',
              image_url: '',
              display_order: categories.length > 0 ? Math.max(...categories.map(c => c.display_order)) + 1 : 0,
              is_active: true,
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
                folder="menu-categories"
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

