// ============================================
// Restaurant Card Component
// ============================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Restaurant } from '../../shared/types';
import { getMenuItems } from '@/lib/api';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const [dishCategories, setDishCategories] = useState<string[]>([]);

  // Получаем категории блюд из меню ресторана
  useEffect(() => {
    async function fetchCategories() {
      try {
        const menuItems = await getMenuItems(restaurant.id, true);
        // Извлекаем уникальные категории из меню
        const categories = Array.from(
          new Set(
            menuItems
              .map(item => item.category)
              .filter((cat): cat is string => cat !== null && cat !== undefined)
          )
        );
        setDishCategories(categories);
      } catch (error) {
        console.error('Error fetching menu categories:', error);
      }
    }
    fetchCategories();
  }, [restaurant.id]);

  // Форматируем категории для отображения
  const categoriesText = dishCategories.length > 0 
    ? dishCategories.join(' • ')
    : restaurant.category || '';

  return (
    <Link href={`/restaurants/${restaurant.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        {/* Изображение ресторана */}
        {restaurant.image_url && (
          <div className="relative w-full h-48">
            <Image
              src={restaurant.image_url}
              alt={restaurant.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        {/* Контент */}
        <div className="p-4 flex flex-col">
          {/* Название ресторана */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">{restaurant.name}</h3>

          {/* Категории блюд */}
          {categoriesText && (
            <p className="text-sm text-gray-600 mb-2">{categoriesText}</p>
          )}

          {/* Описание (как доставляется) */}
          {restaurant.description && (
            <p className="text-xs text-gray-500 line-clamp-2">{restaurant.description}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

