// ============================================
// Menu Item Component
// ============================================

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MenuItem as MenuItemType } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';

interface MenuItemProps {
  item: MenuItemType;
}

export default function MenuItem({ item }: MenuItemProps) {
  const { addItem, updateQuantity, items } = useCart();
  const cartItem = items.find((ci) => ci.item.id === item.id);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddClick = () => {
    if (!item.is_available) return;
    
    if (cartItem) {
      // Если товар уже в корзине, раскрываем счетчик
      setIsExpanded(true);
    } else {
      // Если товара нет, добавляем и раскрываем счетчик
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex items-stretch">
        {item.image_url && (
          <div className="relative w-32 md:w-40 flex-shrink-0">
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 128px, 160px"
            />
          </div>
        )}
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
            <span className="text-lg font-bold text-primary-600">
              {item.price} сум
            </span>
          </div>
          {item.description && (
            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
          )}
          {!item.is_available && (
            <span className="inline-block text-xs text-red-600 font-medium mb-2">
              Mavjud emas
            </span>
          )}
          
          {/* Кнопка добавления / Счетчик количества */}
          <div className="flex items-center justify-end mt-3">
            {!isExpanded && !cartItem ? (
              <button
                onClick={handleAddClick}
                disabled={!item.is_available}
                className="bg-primary-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                aria-label="Savatchaga qo'shish"
              >
                <span className="text-xl font-bold">+</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDecrease}
                  className="bg-gray-200 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-300 transition-colors"
                  aria-label="Miqdorni kamaytirish"
                >
                  <span className="text-lg font-bold">−</span>
                </button>
                <span className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center">
                  {cartItem?.quantity || 0}
                </span>
                <button
                  onClick={handleIncrease}
                  disabled={!item.is_available}
                  className="bg-primary-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  aria-label="Miqdorni oshirish"
                >
                  <span className="text-xl font-bold">+</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

