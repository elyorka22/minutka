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
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden transition-all flex flex-col h-full w-full ${
        !item.is_available
          ? 'opacity-75 grayscale-[0.3] cursor-not-allowed'
          : 'hover:shadow-lg'
      }`}
      style={{ width: '100%', minWidth: 0 }}
    >
      {/* Картинка с плюсиком в правом нижнем углу */}
      {item.image_url && (
        <div className="relative w-full h-40 md:h-48">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className={`object-cover ${!item.is_available ? 'opacity-50' : ''}`}
            sizes="(max-width: 768px) 50vw, 33vw"
          />
          {/* Плюсик в правом нижнем углу картинки */}
          {!isExpanded && !cartItem ? (
            <button
              onClick={handleAddClick}
              disabled={!item.is_available}
              className="absolute bottom-2 right-2 bg-primary-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
              aria-label="Savatchaga qo'shish"
            >
              <span className="text-xl font-bold">+</span>
            </button>
          ) : (
            <div className="absolute bottom-2 right-2 flex items-center gap-2 bg-white rounded-full px-2 py-1 shadow-lg">
              <button
                onClick={handleDecrease}
                className="bg-gray-200 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-300 transition-colors"
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
                className="bg-primary-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                aria-label="Miqdorni oshirish"
              >
                <span className="text-lg font-bold">+</span>
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Контент под картинкой */}
      <div className="p-3 flex flex-col flex-1">
        {/* Цена (под картинкой) */}
        <span
          className={`text-base font-semibold mb-1 ${
            !item.is_available ? 'text-gray-400' : 'text-primary-600'
          }`}
        >
          {item.price} so'm
        </span>
        
        {/* Название блюда (под ценой) */}
        <h3
          className={`text-sm font-bold mb-1 line-clamp-2 ${
            !item.is_available ? 'text-gray-400' : 'text-gray-900'
          }`}
        >
          {item.name}
        </h3>
        
        {/* Статус доступности - надпись "Hozir mavjud emas" */}
        {item.is_available === false && (
          <p className="text-xs text-red-600 font-semibold mb-2">
            Hozir mavjud emas
          </p>
        )}
        
        {/* Описание (опционально, маленькими буквами) */}
        {item.description && (
          <p
            className={`text-xs mb-2 leading-relaxed line-clamp-2 ${
              !item.is_available ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}

