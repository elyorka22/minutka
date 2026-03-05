// ============================================
// Restaurant Categories Grid - Сетка категорий (как на скрине Makro)
// ============================================

'use client';

import Image from 'next/image';
import { shouldUnoptimizeImage } from '@/lib/imageUtils';

export interface Category {
  id: string;
  name: string;
  image_url: string;
  icon?: string;
  is_active?: boolean;
}

interface RestaurantCategoriesProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  allCategoryImage?: string; // Изображение для категории "Все" (в сетке не используется)
}

export default function RestaurantCategories({
  categories,
  selectedCategory,
  onCategorySelect,
  allCategoryImage,
}: RestaurantCategoriesProps) {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-4 gap-4">
        {categories
          .filter((category) => {
            const isAllCategory =
              category.name === 'Все' ||
              category.name === 'Hammasi' ||
              category.name?.toLowerCase() === 'все' ||
              category.name?.toLowerCase() === 'hammasi' ||
              category.id === 'all';
            const isActive = category.is_active === true;
            return !isAllCategory && isActive;
          })
          .map((category) => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              className="flex flex-col items-center gap-2 transition-transform"
            >
              <div className="relative">
                <div
                  className={`relative w-20 h-20 rounded-full overflow-hidden ${
                    category.image_url &&
                    !category.image_url.startsWith('http') &&
                    !category.image_url.startsWith('/')
                      ? 'bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-3xl'
                      : ''
                  }`}
                  style={{
                    boxShadow:
                      selectedCategory === category.id
                        ? '0 0 0 4px rgb(249 115 22)'
                        : '0 0 0 4px rgb(229 231 235)',
                  }}
                >
                  {category.image_url &&
                  !category.image_url.startsWith('http') &&
                  !category.image_url.startsWith('/') ? (
                    <span>{category.image_url}</span>
                  ) : (
                    <Image
                      src={category.image_url}
                      alt={category.name}
                      fill
                      className="object-cover"
                      unoptimized={shouldUnoptimizeImage(category.image_url)}
                    />
                  )}
                </div>
              </div>
              <span
                className={`text-xs font-semibold text-center ${
                  selectedCategory === category.id
                    ? 'text-primary-600'
                    : 'text-gray-700'
                }`}
              >
                {category.name}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}

