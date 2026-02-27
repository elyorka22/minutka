// ============================================
// Menu Item Component
// ============================================

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MenuItem as MenuItemType } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import { shouldUnoptimizeImage } from '@/lib/imageUtils';

interface MenuItemProps {
  item: MenuItemType;
  // Важный товар (верх списка) – картинка грузится с приоритетом
  isPriority?: boolean;
}

export default function MenuItem({ item, isPriority = false }: MenuItemProps) {
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
      className={`bg-white rounded-lg shadow-md overflow-hidden transition-all flex flex-col ${
        !item.is_available
          ? 'opacity-75 grayscale-[0.3] cursor-not-allowed'
          : 'hover:shadow-lg'
      }`}
      style={{ 
        width: '100%',
        height: '100%',
        minWidth: 0
      }}
    >
      {/* Картинка с плюсиком в правом нижнем углу */}
      {item.image_url && (
        <div className="relative w-full h-56 md:h-64 bg-white">
          {/* Ярлык скидки в левом верхнем углу */}
          {item.discount_percent && item.discount_percent > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
              -{item.discount_percent}%
            </div>
          )}
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className={`object-contain ${!item.is_available ? 'opacity-50' : ''}`}
            sizes="(max-width: 768px) 50vw, 33vw"
            unoptimized={shouldUnoptimizeImage(item.image_url)}
            // Первые 10 товаров загружаем с приоритетом, остальные – лениво
            priority={isPriority}
            loading={isPriority ? 'eager' : 'lazy'}
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
      <div className="p-2 flex flex-col flex-1">
        {/* Цена (под картинкой) */}
        <div className="mb-0.5">
          {item.discount_percent && item.discount_percent > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 line-through">
                {item.price} so'm
              </span>
              <span className="text-sm font-semibold text-primary-600">
                {Math.round(item.price * (1 - item.discount_percent / 100))} so'm
              </span>
            </div>
          ) : (
            <span
              className={`text-sm font-semibold ${
                !item.is_available ? 'text-gray-400' : 'text-primary-600'
              }`}
            >
              {item.price} so'm
            </span>
          )}
        </div>
        
        {/* Название блюда (под ценой) */}
        <h3
          className={`text-xs font-bold mb-0.5 line-clamp-2 leading-tight ${
            !item.is_available ? 'text-gray-400' : 'text-gray-900'
          }`}
        >
          {item.name}
        </h3>
        
        {/* Статус доступности - надпись "Hozir mavjud emas" */}
        {item.is_available === false && (
          <p className="text-xs text-red-600 font-semibold mb-1">
            Hozir mavjud emas
          </p>
        )}
        
        {/* Описание (опционально, маленькими буквами) */}
        {item.description && (
          <p
            className={`text-xs mb-1 leading-tight line-clamp-2 ${
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

