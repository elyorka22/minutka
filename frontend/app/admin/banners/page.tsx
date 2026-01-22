// ============================================
// Admin Banners Page - Управление баннерами
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Banner, BannerPosition } from '@/lib/types';
import { demoBanners } from '@/lib/demoData';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  useEffect(() => {
    setBanners(demoBanners);
    setLoading(false);
  }, []);

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот баннер?')) {
      setBanners(banners.filter((b) => b.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setBanners(
      banners.map((b) => (b.id === id ? { ...b, is_active: !b.is_active } : b))
    );
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка баннеров...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🖼️ Управление баннерами</h1>
        <button
          onClick={() => {
            setEditingBanner(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base"
        >
          + Добавить баннер
        </button>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative h-48">
              <img
                src={banner.image_url}
                alt={banner.title || 'Banner'}
                className="w-full h-full object-cover"
              />
              {!banner.is_active && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="text-white font-semibold">Неактивен</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{banner.title || 'Без названия'}</h3>
              <p className="text-sm text-gray-600 mb-2">
                Позиция: <span className="font-medium">{banner.position}</span>
              </p>
              {banner.link_url && (
                <p className="text-xs text-gray-500 mb-4 truncate">{banner.link_url}</p>
              )}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  onClick={() => handleToggleActive(banner.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold ${
                    banner.is_active
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {banner.is_active ? 'Активен' : 'Активировать'}
                </button>
                <button
                  onClick={() => handleEdit(banner)}
                  className="px-3 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm font-semibold hover:bg-primary-200"
                >
                  ✏️ Редактировать
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Banner Form Modal */}
      {showForm && (
        <BannerFormModal
          banner={editingBanner}
          onClose={() => {
            setShowForm(false);
            setEditingBanner(null);
          }}
          onSave={(banner) => {
            if (editingBanner) {
              setBanners(banners.map((b) => (b.id === banner.id ? banner : b)));
            } else {
              setBanners([...banners, banner]);
            }
            setShowForm(false);
            setEditingBanner(null);
          }}
        />
      )}
    </div>
  );
}

// Banner Form Modal Component
function BannerFormModal({
  banner,
  onClose,
  onSave,
}: {
  banner: Banner | null;
  onClose: () => void;
  onSave: (banner: Banner) => void;
}) {
  const [formData, setFormData] = useState({
    restaurant_id: banner?.restaurant_id || null,
    title: banner?.title || '',
    image_url: banner?.image_url || '',
    link_url: banner?.link_url || '',
    position: banner?.position || 'homepage',
    is_active: banner?.is_active ?? true,
    display_order: banner?.display_order || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBanner: Banner = {
      id: banner?.id || Date.now().toString(),
      restaurant_id: formData.restaurant_id,
      title: formData.title || null,
      image_url: formData.image_url,
      link_url: formData.link_url || null,
      position: formData.position,
      is_active: formData.is_active,
      display_order: formData.display_order,
      created_at: banner?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onSave(newBanner);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {banner ? 'Редактировать баннер' : 'Добавить баннер'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl flex-shrink-0">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Заголовок
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL изображения *
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL ссылки
              </label>
              <input
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Позиция *
              </label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value as BannerPosition })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="homepage">Главная страница</option>
                <option value="recommended">Рекомендуем сегодня</option>
                <option value="restaurant_page">Страница ресторана</option>
              </select>
            </div>

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
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Активен</span>
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

