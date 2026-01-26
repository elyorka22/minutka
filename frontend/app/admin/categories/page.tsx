// ============================================
// Restaurant Categories Management Page
// ============================================

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';

interface Category {
  id: string;
  name: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    image_url: '',
    display_order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      const data = await response.json();
      // Сортируем категории так, чтобы "Все"/"Hammasi" была первой
      const categoriesList = data.data || [];
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

  const handleCancel = () => {
    setEditing(null);
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm"
                >
                  ✏️ Редактировать
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
    </div>
  );
}

