// ============================================
// Restaurant Card Component
// ============================================

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Restaurant } from '../../shared/types';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  // Используем категорию ресторана напрямую, без дополнительных запросов
  // Это ускоряет загрузку страницы
  const categoriesText = restaurant.category || '';

  // Определяем URL в зависимости от типа (ресторан или магазин)
  const href = restaurant.type === 'store' ? `/stores/${restaurant.id}` : `/restaurants/${restaurant.id}`;

  return (
    <Link href={href} prefetch={true}>
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
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
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

