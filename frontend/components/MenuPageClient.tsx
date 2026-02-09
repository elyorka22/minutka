// ============================================
// Menu Page Client Component
// ============================================

'use client';

import { useEffect } from 'react';
import { Restaurant } from '@/lib/types';
import { MenuCategory, MenuItem as MenuItemType } from '@/lib/types';
import MenuItem from './MenuItem';
import MenuItemBanner from './MenuItemBanner';
import { trackMenuView } from '@/lib/api';

interface MenuPageClientProps {
  restaurant: Restaurant;
  bannerItems: MenuItemType[];
  menuByCategory: MenuCategory[];
  restaurantId: string;
}

export default function MenuPageClient({
  restaurant,
  bannerItems,
  menuByCategory,
  restaurantId,
}: MenuPageClientProps) {
  // Отслеживаем просмотр меню
  useEffect(() => {
    // Получаем Telegram user ID из window, если открыто в Telegram Web App
    const telegramUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    const telegramUserId = telegramUser?.id;

    // Отслеживаем просмотр
    trackMenuView(restaurantId, {
      userAgent: navigator.userAgent,
      referer: document.referrer,
      telegramUserId: telegramUserId ? BigInt(telegramUserId) : undefined,
    }).catch((error) => {
      console.error('Error tracking menu view:', error);
      // Не показываем ошибку пользователю, просто логируем
    });
  }, [restaurantId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {restaurant.image_url && (
              <img
                src={restaurant.image_url}
                alt={restaurant.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="text-sm text-gray-600 mt-1">{restaurant.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Banner Items */}
      {bannerItems.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">⭐ Tavsiya etamiz</h2>
          <div className="space-y-4">
            {bannerItems.map((item) => (
              <MenuItemBanner key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Menu by Categories */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        {menuByCategory.length > 0 ? (
          menuByCategory.map((category) => (
            <div key={category.name} className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{category.name}</h2>
              <div className="grid grid-cols-1 gap-4">
                {category.items.map((item) => (
                  <MenuItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Меню пока пусто</p>
          </div>
        )}
      </section>
    </div>
  );
}


