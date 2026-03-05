'use client';

// ============================================
// Categories Page - товары главной страницы по категории
// ============================================

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMenuItems } from '@/lib/api';
import MenuItem from '@/components/MenuItem';

interface MenuItemWithStore {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
}

export default function CategoryPage() {
  const params = useParams<{ name: string }>();
  const router = useRouter();
  const rawName = params?.name || '';
  const categoryName = decodeURIComponent(rawName);

  const [items, setItems] = useState<MenuItemWithStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getMenuItems(undefined, true, categoryName);
        setItems(data || []);
      } catch (error) {
        console.error('[CategoryPage] Error loading items for category:', categoryName, error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    if (categoryName) {
      load();
    }
  }, [categoryName]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium"
          >
            ← Orqaga
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {categoryName}
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Tez kunlarda</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {items.map((item, index) => (
              <MenuItem
                key={item.id}
                item={item as any}
                isPriority={index < 10}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


