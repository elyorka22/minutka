// ============================================
// Restaurant Categories Carousel - Карусель категорий ресторанов
// ============================================

'use client';

import { useState } from 'react';
import Image from 'next/image';

export interface Category {
  id: string;
  name: string;
  image_url: string;
  icon?: string;
}

interface RestaurantCategoriesProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  allCategoryImage?: string; // Изображение для категории "Все"
}

export default function RestaurantCategories({
  categories,
  selectedCategory,
  onCategorySelect,
  allCategoryImage,
}: RestaurantCategoriesProps) {
  const [scrollPosition, setScrollPosition] = useState(0);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('categories-carousel');
    if (container) {
      const scrollAmount = 200;
      const newPosition = direction === 'left' 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  return (
    <div className="relative mb-8">
      <div className="flex items-center gap-4">
        {/* Scroll Left Button */}
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow z-10"
          aria-label="Прокрутить влево"
        >
          <span className="text-2xl text-gray-600">‹</span>
        </button>

        {/* Categories Carousel */}
        <div
          id="categories-carousel"
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* All Categories Button */}
          <button
            onClick={() => onCategorySelect(null)}
            className={`flex-shrink-0 flex flex-col items-center gap-3 transition-all ${
              selectedCategory === null
                ? 'scale-105'
                : ''
            }`}
          >
            {allCategoryImage && allCategoryImage.trim() !== '' ? (
              <div className={`relative w-20 h-20 rounded-full overflow-hidden ring-4 transition-all ${
                selectedCategory === null
                  ? 'ring-primary-500 ring-offset-2'
                  : 'ring-gray-200 ring-offset-0 hover:ring-primary-300'
              }`}>
                <Image
                  src={allCategoryImage}
                  alt="Hammasi"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    console.error('Error loading all category image:', allCategoryImage);
                    // Fallback to emoji if image fails to load
                    const target = e.target as HTMLImageElement;
                    if (target.parentElement) {
                      target.parentElement.innerHTML = '<div class="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-3xl">🍽️</div>';
                    }
                  }}
                />
              </div>
            ) : (
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-3xl ring-4 transition-all ${
                selectedCategory === null
                  ? 'ring-primary-500 ring-offset-2'
                  : 'ring-gray-200 ring-offset-0'
              }`}>
                🍽️
              </div>
            )}
            <span className={`text-sm font-semibold text-center ${
              selectedCategory === null ? 'text-primary-600' : 'text-gray-700'
            }`}>
              Hammasi
            </span>
          </button>

          {/* Category Items */}
          {categories
            .filter(category => {
              // Исключаем категорию "Все"/"Hammasi" из списка, так как она уже показывается как кнопка "Все"
              const isAllCategory = 
                category.name === 'Все' || 
                category.name === 'Hammasi' || 
                category.name?.toLowerCase() === 'все' ||
                category.name?.toLowerCase() === 'hammasi' ||
                category.id === 'all';
              return !isAllCategory;
            })
            .map((category) => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-3 transition-all ${
                selectedCategory === category.id
                  ? 'scale-105'
                  : ''
              }`}
            >
              <div className={`relative w-20 h-20 rounded-full overflow-hidden ring-4 transition-all ${
                selectedCategory === category.id
                  ? 'ring-primary-500 ring-offset-2'
                  : 'ring-gray-200 ring-offset-0 hover:ring-primary-300'
              }`}>
                <Image
                  src={category.image_url}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
              <span className={`text-sm font-semibold text-center whitespace-nowrap ${
                selectedCategory === category.id ? 'text-primary-600' : 'text-gray-700'
              }`}>
                {category.name}
              </span>
            </button>
          ))}
        </div>

        {/* Scroll Right Button */}
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow z-10"
          aria-label="Прокрутить вправо"
        >
          <span className="text-2xl text-gray-600">›</span>
        </button>
      </div>

      {/* Hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

