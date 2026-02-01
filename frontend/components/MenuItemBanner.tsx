// ============================================
// Menu Item Banner Component - Большой баннер для блюд
// ============================================

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MenuItem as MenuItemType } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';

interface MenuItemBannerProps {
  item: MenuItemType;
}

export default function MenuItemBanner({ item }: MenuItemBannerProps) {
  const { addItem, updateQuantity, items } = useCart();
  const cartItem = items.find((ci) => ci.item.id === item.id);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddClick = () => {
    if (!item.is_available) return;
    
    if (cartItem) {
      setIsExpanded(true);
    } else {
      addItem(item, 1);
      setIsExpanded(true);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      setIsExpanded(false);
    }
    updateQuantity(item.id, newQuantity);
  };

  const handleDecrease = () => {
    if (cartItem && cartItem.quantity > 1) {
      handleQuantityChange(cartItem.quantity - 1);
    } else {
      handleQuantityChange(0);
    }
  };

  const handleIncrease = () => {
    if (cartItem) {
      handleQuantityChange(cartItem.quantity + 1);
    } else {
      addItem(item, 1);
      setIsExpanded(true);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all ${
        !item.is_available
          ? 'opacity-75 grayscale-[0.3] cursor-not-allowed'
          : 'hover:shadow-xl'
      }`}
    >
      {/* Большая картинка */}
      {item.image_url && (
        <div className="relative w-full h-48 md:h-56">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className={`object-cover ${!item.is_available ? 'opacity-50' : ''}`}
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          {/* Кнопка добавления в корзину */}
          {!isExpanded && !cartItem ? (
            <button
              onClick={handleAddClick}
              disabled={!item.is_available}
              className="absolute bottom-3 right-3 bg-primary-500 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
              aria-label="Savatchaga qo'shish"
            >
              <span className="text-xl font-bold">+</span>
            </button>
          ) : (
            <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-white rounded-full px-2 py-1 shadow-lg">
              <button
                onClick={handleDecrease}
                className="bg-gray-200 text-gray-700 rounded-full w-9 h-9 flex items-center justify-center hover:bg-gray-300 transition-colors"
                aria-label="Miqdorni kamaytirish"
              >
                <span className="text-lg font-bold">−</span>
              </button>
              <span className="text-base font-semibold text-gray-900 min-w-[1.5rem] text-center">
                {cartItem?.quantity || 0}
              </span>
              <button
                onClick={handleIncrease}
                disabled={!item.is_available}
                className="bg-primary-500 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                aria-label="Miqdorni oshirish"
              >
                <span className="text-lg font-bold">+</span>
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Контент под картинкой */}
      <div className="p-4">
        {/* Название блюда */}
        <h3
          className={`text-lg md:text-xl font-bold mb-1 ${
            !item.is_available ? 'text-gray-400' : 'text-gray-900'
          }`}
        >
          {item.name}
        </h3>
        
        {/* Статус доступности */}
        {item.is_available === false && (
          <p className="text-xs text-red-600 font-semibold mb-2">
            Hozir mavjud emas
          </p>
        )}
        
        {/* Описание */}
        {item.description && (
          <p
            className={`text-xs md:text-sm mb-3 leading-relaxed line-clamp-2 ${
              !item.is_available ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {item.description}
          </p>
        )}
        
        {/* Цена */}
        <div className="flex items-center justify-between">
          <span
            className={`text-lg md:text-xl font-bold ${
              !item.is_available ? 'text-gray-400' : 'text-primary-600'
            }`}
          >
            {item.price} so'm
          </span>
        </div>
      </div>
    </div>
  );
}

