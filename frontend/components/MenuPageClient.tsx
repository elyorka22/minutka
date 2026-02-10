// ============================================
// Menu Page Client Component
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { Restaurant } from '@/lib/types';
import { MenuCategory, MenuItem as MenuItemType } from '@/lib/types';
import { MenuCategory as MenuCategoryType } from '@/lib/api';
import MenuItem from './MenuItem';
import MenuItemBanner from './MenuItemBanner';
import { trackMenuView } from '@/lib/api';
import Image from 'next/image';

interface MenuPageClientProps {
  restaurant: Restaurant;
  bannerItems: MenuItemType[];
  menuByCategory: MenuCategory[];
  menuCategories?: MenuCategoryType[];
  restaurantId: string;
}

export default function MenuPageClient({
  restaurant,
  bannerItems,
  menuByCategory,
  menuCategories = [],
  restaurantId,
}: MenuPageClientProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Отладочная информация
  useEffect(() => {
    console.log('MenuPageClient - menuCategories:', menuCategories);
    console.log('MenuPageClient - active categories:', menuCategories.filter(cat => cat.is_active));
  }, [menuCategories]);

  // Отслеживаем просмотр меню
  useEffect(() => {
    // Получаем Telegram user ID из window, если открыто в Telegram Web App
    const telegramUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    const telegramUserId = telegramUser?.id;

    // Отслеживаем просмотр
    trackMenuView(restaurantId, {
      userAgent: navigator.userAgent,
      referer: document.referrer,
      telegramUserId: telegramUserId ? BigInt(telegramUserId) : undefined,
    }).catch((error) => {
      console.error('Error tracking menu view:', error);
      // Не показываем ошибку пользователю, просто логируем
    });
  }, [restaurantId]);

  // Функция для прокрутки карусели
  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('menu-categories-carousel');
    if (container) {
      const scrollAmount = 200;
      const newPosition = direction === 'left' 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  // Фильтруем меню по выбранной категории
  const filteredMenuByCategory = selectedCategoryId
    ? menuByCategory.filter(cat => (cat as any).id === selectedCategoryId)
    : menuByCategory;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {restaurant.image_url && (
              <img
                src={restaurant.image_url}
                alt={restaurant.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="text-sm text-gray-600 mt-1">{restaurant.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Banner Items */}
      {bannerItems.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">⭐ Tavsiya etamiz</h2>
          <div className="space-y-4">
            {bannerItems.map((item) => (
              <MenuItemBanner key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Categories Carousel */}
      {menuCategories.filter(cat => cat.is_active).length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-6">
          <div className="relative">
            <div className="flex items-center gap-4">
              {/* Scroll Left Button */}
              <button
                onClick={() => scroll('left')}
                className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow z-10 flex-shrink-0"
                aria-label="Прокрутить влево"
              >
                <span className="text-2xl text-gray-600">‹</span>
              </button>

              {/* Categories Carousel */}
              <div
                id="menu-categories-carousel"
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {/* Кнопка "Все" */}
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg transition-all flex-shrink-0 ${
                    selectedCategoryId === null
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    selectedCategoryId === null ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <span className="text-sm font-semibold whitespace-nowrap">Все</span>
                </button>

                {/* Category Items */}
                {menuCategories.filter(cat => cat.is_active).map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg transition-all flex-shrink-0 ${
                      selectedCategoryId === category.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 shadow-md hover:shadow-lg'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center ${
                      selectedCategoryId === category.id ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      {category.image_url ? (
                        <Image
                          src={category.image_url}
                          alt={category.name}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-2xl">📂</span>
                      )}
                    </div>
                    <span className={`text-sm font-semibold text-center whitespace-nowrap ${
                      selectedCategoryId === category.id ? 'text-white' : 'text-gray-700'
                    }`}>
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Scroll Right Button */}
              <button
                onClick={() => scroll('right')}
                className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow z-10 flex-shrink-0"
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
        </section>
      )}

      {/* Menu by Categories - Horizontal Carousels */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        {filteredMenuByCategory.length > 0 ? (
          filteredMenuByCategory.map((category, categoryIndex) => {
            const carouselId = `category-carousel-${categoryIndex}`;
            
            const scrollCategory = (direction: 'left' | 'right', carouselId: string) => {
              const container = document.getElementById(carouselId);
              if (container) {
                const scrollAmount = 300;
                const currentScroll = container.scrollLeft;
                const newPosition = direction === 'left' 
                  ? currentScroll - scrollAmount 
                  : currentScroll + scrollAmount;
                container.scrollTo({ left: newPosition, behavior: 'smooth' });
              }
            };

            return (
              <div key={category.name} className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{category.name}</h2>
                {category.items.length > 0 ? (
                  <div className="relative">
                    {/* Scroll Left Button */}
                    <button
                      onClick={() => scrollCategory('left', carouselId)}
                      className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow"
                      aria-label="Прокрутить влево"
                    >
                      <span className="text-2xl text-gray-600">‹</span>
                    </button>

                    {/* Horizontal Carousel */}
                    <div
                      id={carouselId}
                      className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
                      style={{ 
                        scrollbarWidth: 'none', 
                        msOverflowStyle: 'none',
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'nowrap'
                      }}
                    >
                      {category.items.map((item) => (
                        <div 
                          key={item.id} 
                          className="flex-shrink-0"
                          style={{ 
                            width: '256px',
                            minWidth: '256px',
                            maxWidth: '256px'
                          }}
                        >
                          <MenuItem item={item} />
                        </div>
                      ))}
                    </div>

                    {/* Scroll Right Button */}
                    <button
                      onClick={() => scrollCategory('right', carouselId)}
                      className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow"
                      aria-label="Прокрутить вправо"
                    >
                      <span className="text-2xl text-gray-600">›</span>
                    </button>

                    {/* Hide scrollbar */}
                    <style jsx>{`
                      #${carouselId}::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>В этой категории пока нет блюд</p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Меню пока пусто</p>
          </div>
        )}
      </section>
    </div>
  );
}


