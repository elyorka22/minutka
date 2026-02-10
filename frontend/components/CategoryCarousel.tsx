// ============================================
// Category Carousel Component - Horizontal scrollable carousel for menu items
// ============================================

'use client';

import { MenuCategory, MenuItem as MenuItemType } from '@/lib/types';
import MenuItem from './MenuItem';

interface CategoryCarouselProps {
  category: MenuCategory;
  categoryIndex: number;
}

export default function CategoryCarousel({ category, categoryIndex }: CategoryCarouselProps) {
  const carouselId = `category-carousel-${categoryIndex}`;
  
  const scrollCategory = (direction: 'left' | 'right') => {
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

  if (category.items.length === 0) {
    return (
      <div className="mb-8 last:mb-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{category.name}</h2>
        <div className="text-center py-8 text-gray-500">
          <p>В этой категории пока нет блюд</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 last:mb-0 w-full overflow-hidden">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{category.name}</h2>
      <div className="relative w-full">
        {/* Scroll Left Button */}
        <button
          onClick={() => scrollCategory('left')}
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
            flexWrap: 'nowrap',
            width: '100%',
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {category.items.map((item) => (
            <div 
              key={item.id} 
              className="flex-shrink-0"
              style={{ 
                width: '256px',
                minWidth: '256px',
                maxWidth: '256px',
                flexShrink: 0,
                flexGrow: 0
              }}
            >
              <div style={{ width: '100%', height: '100%' }}>
                <MenuItem item={item} />
              </div>
            </div>
          ))}
        </div>

        {/* Scroll Right Button */}
        <button
          onClick={() => scrollCategory('right')}
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
    </div>
  );
}

