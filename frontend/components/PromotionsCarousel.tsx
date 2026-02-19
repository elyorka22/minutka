// ============================================
// Promotions Carousel Component
// Карусель акций на главном экране
// ============================================

'use client';

import { useState, useRef, useEffect } from 'react';
import MenuItem from './MenuItem';
import { MenuItem as MenuItemType } from '@/lib/types';

interface Promotion {
  id: string;
  name: string;
  discount_percent: number;
  items: MenuItemType[];
}

interface PromotionsCarouselProps {
  promotions: Promotion[];
}

export default function PromotionsCarousel({ promotions }: PromotionsCarouselProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Логирование для отладки
  useEffect(() => {
    console.log('[PromotionsCarousel] Received promotions:', promotions);
    console.log('[PromotionsCarousel] Promotions count:', promotions.length);
    promotions.forEach((promo, index) => {
      console.log(`[PromotionsCarousel] Promotion ${index}:`, promo.name, 'items:', promo.items?.length || 0);
    });
  }, [promotions]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = 300; // Прокрутка на 300px за раз

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Отслеживаем позицию прокрутки для показа/скрытия кнопок
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateScrollPosition = () => {
      setScrollPosition(container.scrollLeft);
    };

    container.addEventListener('scroll', updateScrollPosition);
    updateScrollPosition(); // Инициализация

    return () => {
      container.removeEventListener('scroll', updateScrollPosition);
    };
  }, []);

  if (promotions.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">🎁 Акции</h2>
      
      {promotionsWithItems.map((promotion) => (
        <div key={promotion.id} className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            {promotion.name} (-{promotion.discount_percent}%)
          </h3>
          
          <div className="relative">
            {/* Кнопка прокрутки влево */}
            {scrollPosition > 0 && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                aria-label="Прокрутить влево"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}

            {/* Карусель товаров */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {promotion.items.map((item) => (
                <div
                  key={item.id}
                  className="flex-shrink-0"
                  style={{
                    width: '150px',
                    minWidth: '150px',
                    maxWidth: '150px',
                  }}
                >
                  <MenuItem item={item} discountPercent={promotion.discount_percent} />
                </div>
              ))}
            </div>

            {/* Кнопка прокрутки вправо */}
            {scrollContainerRef.current && 
             scrollPosition < (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth - 10) && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                aria-label="Прокрутить вправо"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

