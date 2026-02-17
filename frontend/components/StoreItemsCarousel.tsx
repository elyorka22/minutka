// ============================================
// Store Items Carousel Component - Client Component for store items
// ============================================

'use client';

import { MenuItem as MenuItemType } from '@/lib/types';
import MenuItem from './MenuItem';

interface StoreItemsCarouselProps {
  items: MenuItemType[];
  carouselIndex?: number;
}

export default function StoreItemsCarousel({ items, carouselIndex = 0 }: StoreItemsCarouselProps) {
  const carouselId = `store-items-carousel-${carouselIndex}`;
  
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

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="relative w-full" style={{ overflow: 'hidden' }}>
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
            WebkitOverflowScrolling: 'touch',
            alignItems: 'stretch',
            boxSizing: 'border-box',
            alignContent: 'stretch'
          } as React.CSSProperties}
        >
          {items.map((item) => (
            <div 
              key={item.id} 
              className="flex-shrink-0"
              style={{ 
                width: '150px',
                minWidth: '150px',
                maxWidth: '150px',
                flexShrink: 0,
                flexGrow: 0,
                flexBasis: '150px',
                display: 'flex',
                height: '100%'
              }}
            >
              <MenuItem item={item} />
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
      </div>
    </div>
  );
}

