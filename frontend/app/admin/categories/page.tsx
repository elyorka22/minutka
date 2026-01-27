// ============================================
// Restaurant Categories Management Page
// ============================================

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';
import { getRestaurants } from '@/lib/api';
import {
  getRestaurantCategoryRelations,
  createRestaurantCategoryRelation,
  deleteRestaurantCategoryRelationByIds,
} from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

interface Category {
  id: string;
  name: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Restaurant {
  id: string;
  name: string;
  image_url: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRestaurantModal, setShowRestaurantModal] = useState<string | null>(null);
  const [categoryRestaurants, setCategoryRestaurants] = useState<{ [key: string]: string[] }>({});
  const [formData, setFormData] = useState({
    name: '',
    image_url: '',
    display_order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      fetchCategoryRestaurants();
    }
  }, [categories]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      const data = await response.json();
      // Сортируем категории так, чтобы "Все"/"Hammasi" была первой
      let categoriesList = data.data || [];
      
      // Проверяем, есть ли категория "Аптеки/Магазины"
      const pharmaciesCategory = categoriesList.find((c: Category) => 
        c.name === 'Аптеки/Магазины' || c.name === 'Pharmacies/Stores' || c.id === 'pharmacies-stores'
      );
      
      // Если категории нет, создаем её автоматически
      if (!pharmaciesCategory) {
        try {
          const createResponse = await fetch(`${API_BASE_URL}/api/categories`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: 'Аптеки/Магазины',
              image_url: '💊', // Временная эмодзи, можно будет заменить на картинку
              display_order: categoriesList.length,
              is_active: true,
            }),
          });
          
          if (createResponse.ok) {
            const newCategory = await createResponse.json();
            categoriesList.push(newCategory.data);
          }
        } catch (error) {
          console.error('Error creating pharmacies category:', error);
        }
      }
      
      const allCategory = categoriesList.find((c: Category) => 
        c.name === 'Все' || c.name === 'Hammasi' || c.id === 'all'
      );
      const otherCategories = categoriesList.filter((c: Category) => 
        c.name !== 'Все' && c.name !== 'Hammasi' && c.id !== 'all'
      );
      setCategories(allCategory ? [allCategory, ...otherCategories] : categoriesList);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const result = await getRestaurants();
      setRestaurants(result.data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const fetchCategoryRestaurants = async () => {
    try {
      const relations: { [key: string]: string[] } = {};
      for (const category of categories) {
        const categoryRels = await getRestaurantCategoryRelations(undefined, category.id);
        relations[category.id] = categoryRels.map((rel: any) => rel.restaurant_id);
      }
      setCategoryRestaurants(relations);
    } catch (error) {
      console.error('Error fetching category restaurants:', error);
    }
  };

  const handleToggleRestaurant = async (categoryId: string, restaurantId: string) => {
    try {
      const isAttached = categoryRestaurants[categoryId]?.includes(restaurantId);
      
      if (isAttached) {
        // Удаляем связь
        await deleteRestaurantCategoryRelationByIds(restaurantId, categoryId);
        showSuccess('Ресторан отвязан от категории');
      } else {
        // Создаем связь
        await createRestaurantCategoryRelation(restaurantId, categoryId);
        showSuccess('Ресторан привязан к категории');
      }
      
      // Обновляем локальное состояние
      const updated = { ...categoryRestaurants };
      if (!updated[categoryId]) {
        updated[categoryId] = [];
      }
      if (isAttached) {
        updated[categoryId] = updated[categoryId].filter(id => id !== restaurantId);
      } else {
        updated[categoryId] = [...updated[categoryId], restaurantId];
      }
      setCategoryRestaurants(updated);
    } catch (error: any) {
      console.error('Error toggling restaurant:', error);
      showError('Ошибка при изменении связи');
    }
  };

  const handleEdit = (category: Category) => {
    setEditing(category.id);
    setFormData({
      name: category.name,
      image_url: category.image_url,
      display_order: category.display_order,
      is_active: category.is_active,
    });
    setShowAddForm(false);
  };

  const handleEditImage = (category: Category) => {
    setEditingImage(category.id);
    setNewImageUrl(category.image_url);
    setShowAddForm(false);
    setEditing(null);
  };

  const handleSaveImage = async (categoryId: string) => {
    if (!newImageUrl) {
      alert('Пожалуйста, загрузите изображение');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_url: newImageUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to update category image');
      }

      await fetchCategories();
      setEditingImage(null);
      setNewImageUrl('');
      showSuccess('Изображение категории успешно обновлено!');
    } catch (error) {
      console.error('Error updating category image:', error);
      showError('Ошибка при обновлении изображения');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setEditingImage(null);
    setNewImageUrl('');
    setShowAddForm(false);
    setFormData({
      name: '',
      image_url: '',
      display_order: 0,
      is_active: true,
    });
  };

  const handleSave = async (id?: string) => {
    setSaving(true);
    try {
      const url = id
        ? `${API_BASE_URL}/api/categories/${id}`
        : `${API_BASE_URL}/api/categories`;
      const method = id ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save category');
      }

      await fetchCategories();
      handleCancel();
      alert(id ? 'Категория успешно обновлена!' : 'Категория успешно создана!');
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Ошибка при сохранении категории');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      await fetchCategories();
      alert('Категория успешно удалена!');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Ошибка при удалении категории');
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${category.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !category.is_active }),
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      await fetchCategories();
    } catch (error) {
      console.error('Error toggling category:', error);
      alert('Ошибка при обновлении категории');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка категорий...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🏷️ Категории ресторанов</h1>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditing(null);
            setFormData({
              name: '',
              image_url: '',
              display_order: categories.length,
              is_active: true,
            });
          }}
          className="w-full sm:w-auto px-6 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base"
        >
          + Добавить категорию
        </button>
      </div>

      {/* Информация о категории "Все" */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800 mb-2">
          <strong>💡 Важно:</strong> Чтобы категория "Все" (Hammasi) отображалась с картинкой на главной странице, создайте категорию с названием <strong>"Hammasi"</strong> или <strong>"Все"</strong> и загрузите для неё изображение.
        </p>
        {categories.length > 0 && categories.some(c => 
          c.name === 'Все' || 
          c.name === 'Hammasi' || 
          c.name?.toLowerCase() === 'все' ||
          c.name?.toLowerCase() === 'hammasi' ||
          c.id === 'all'
        ) ? (
          <div>
            <p className="text-sm text-green-700 font-semibold mb-2">
              ✅ Категория "Все" найдена! Загрузите изображение для неё, чтобы оно отображалось на главной странице.
            </p>
            {(() => {
              const allCat = categories.find(c => 
                c.name === 'Все' || 
                c.name === 'Hammasi' || 
                c.name?.toLowerCase() === 'все' ||
                c.name?.toLowerCase() === 'hammasi' ||
                c.id === 'all'
              );
              if (allCat && (!allCat.image_url || allCat.image_url.trim() === '')) {
                return (
                  <button
                    onClick={() => handleEdit(allCat)}
                    className="text-sm text-blue-700 underline hover:text-blue-900"
                  >
                    ✏️ Редактировать категорию "Все" и загрузить изображение
                  </button>
                );
              }
              return null;
            })()}
          </div>
        ) : (
          <div>
            <p className="text-sm text-orange-700 mb-2">
              ⚠️ Категория "Все" не найдена. Создайте категорию с названием "Hammasi" или "Все".
            </p>
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditing(null);
                setFormData({
                  name: 'Hammasi',
                  image_url: '',
                  display_order: -1, // Первая в списке
                  is_active: true,
                });
              }}
              className="text-sm px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
            >
              + Создать категорию "Hammasi"
            </button>
          </div>
        )}
      </div>

      {/* Image Edit Modal */}
      {editingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Изменить картинку категории "{categories.find(c => c.id === editingImage)?.name}"
              </h2>
              <div className="space-y-4">
                <ImageUpload
                  value={newImageUrl}
                  onChange={(url) => setNewImageUrl(url)}
                  folder="categories"
                  label="Новое изображение категории"
                  required
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSaveImage(editingImage)}
                    disabled={saving || !newImageUrl}
                    className="flex-1 px-6 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editing) && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            {editing ? 'Редактировать категорию' : 'Добавить новую категорию'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название категории *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Например: Italyan"
              />
            </div>
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              folder="categories"
              label="Изображение категории"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Порядок отображения
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                Активна
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleSave(editing || undefined)}
                disabled={saving || !formData.name || !formData.image_url}
                className="w-full sm:w-auto px-6 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {saving ? 'Сохранение...' : editing ? 'Сохранить изменения' : 'Создать'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative w-full h-48">
              <Image
                src={category.image_url}
                alt={category.name}
                fill
                className="object-cover"
              />
              {!category.is_active && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="text-white font-semibold">Неактивна</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
              <div className="text-sm text-gray-600 mb-4">
                <p>Порядок: {category.display_order}</p>
                <p>Статус: {category.is_active ? '✅ Активна' : '❌ Неактивна'}</p>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <p>Привязано ресторанов: {categoryRestaurants[category.id]?.length || 0}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  onClick={() => {
                    setShowRestaurantModal(category.id);
                    setEditing(null);
                    setShowAddForm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm"
                >
                  🏪 Рестораны ({categoryRestaurants[category.id]?.length || 0})
                </button>
                <button
                  onClick={() => handleEditImage(category)}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm"
                >
                  🖼️ Изменить картинку
                </button>
                <button
                  onClick={() => handleToggleActive(category)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                    category.is_active
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {category.is_active ? '⏸️' : '▶️'}
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Категории не найдены. Добавьте первую категорию.
        </div>
      )}

      {/* Modal for managing restaurants in category */}
      {showRestaurantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Рестораны в категории "{categories.find(c => c.id === showRestaurantModal)?.name}"
              </h2>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {restaurants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Рестораны не найдены
                </div>
              ) : (
                <div className="space-y-3">
                  {restaurants.map((restaurant) => {
                    const isAttached = categoryRestaurants[showRestaurantModal]?.includes(restaurant.id);
                    return (
                      <div
                        key={restaurant.id}
                        className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                          isAttached
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleToggleRestaurant(showRestaurantModal, restaurant.id)}
                      >
                        <div className="flex-shrink-0">
                          {restaurant.image_url ? (
                            <Image
                              src={restaurant.image_url}
                              alt={restaurant.name}
                              width={60}
                              height={60}
                              className="rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-15 h-15 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400">🍽️</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                        </div>
                        <div className="flex-shrink-0">
                          {isAttached ? (
                            <span className="text-green-600 font-semibold">✓ Привязан</span>
                          ) : (
                            <span className="text-gray-400">Не привязан</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-6 border-t">
              <button
                onClick={() => setShowRestaurantModal(null)}
                className="w-full px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

