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
        <div className="relative w-full h-64 md:h-80">
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
              className="absolute bottom-4 right-4 bg-primary-500 text-white rounded-full w-14 h-14 flex items-center justify-center hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
              aria-label="Savatchaga qo'shish"
            >
              <span className="text-2xl font-bold">+</span>
            </button>
          ) : (
            <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-white rounded-full px-3 py-2 shadow-lg">
              <button
                onClick={handleDecrease}
                className="bg-gray-200 text-gray-700 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-300 transition-colors"
                aria-label="Miqdorni kamaytirish"
              >
                <span className="text-xl font-bold">−</span>
              </button>
              <span className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center">
                {cartItem?.quantity || 0}
              </span>
              <button
                onClick={handleIncrease}
                disabled={!item.is_available}
                className="bg-primary-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                aria-label="Miqdorni oshirish"
              >
                <span className="text-xl font-bold">+</span>
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Контент под картинкой */}
      <div className="p-6">
        {/* Название блюда */}
        <h3
          className={`text-xl md:text-2xl font-bold mb-2 ${
            !item.is_available ? 'text-gray-400' : 'text-gray-900'
          }`}
        >
          {item.name}
        </h3>
        
        {/* Статус доступности */}
        {item.is_available === false && (
          <p className="text-sm text-red-600 font-semibold mb-3">
            Hozir mavjud emas
          </p>
        )}
        
        {/* Описание */}
        {item.description && (
          <p
            className={`text-sm md:text-base mb-4 leading-relaxed ${
              !item.is_available ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {item.description}
          </p>
        )}
        
        {/* Цена */}
        <div className="flex items-center justify-between">
          <span
            className={`text-xl md:text-2xl font-bold ${
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

