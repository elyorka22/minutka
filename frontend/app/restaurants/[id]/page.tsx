// ============================================
// Restaurant Detail Page - Страница ресторана
// ============================================

import { notFound } from 'next/navigation';
import { getRestaurantById, getMenuItems } from '@/lib/api';
import { getMenuCategories } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { shouldUnoptimizeImage } from '@/lib/imageUtils';
import MenuItemBanner from '@/components/MenuItemBanner';
import MenuItem from '@/components/MenuItem';
import Cart from '@/components/Cart';
import { MenuItem as MenuItemType, MenuCategory } from '@/lib/types';

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'your_bot_username';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function RestaurantPage({ params }: PageProps) {
  // Загружаем данные из API
  const [restaurant, menuItems, menuCategories] = await Promise.all([
    getRestaurantById(params.id).catch(() => null),
    getMenuItems(params.id, true), // includeUnavailable = true
    getMenuCategories(params.id, false).catch(() => []),
  ]);

  if (!restaurant || restaurant.type !== 'restaurant') {
    notFound();
  }

  // Разделяем товары на баннеры и обычные
  const bannerItems = menuItems.filter((item: MenuItemType) => item.is_banner === true);
  const regularItems = menuItems.filter((item: MenuItemType) => !item.is_banner);

  // Группируем меню по категориям
  const menuByCategory: MenuCategory[] = [];

  if (menuCategories.length > 0) {
    // Используем категории из БД
    const categoryMap = new Map<string, MenuItemType[]>();
    
    regularItems.forEach((item) => {
      const categoryId = item.category_id || 'uncategorized';
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, []);
      }
      categoryMap.get(categoryId)!.push(item);
    });

    menuCategories.forEach((category) => {
      const items = categoryMap.get(category.id) || [];
      if (items.length > 0 || category.is_active) {
        menuByCategory.push({
          id: category.id,
          name: category.name,
          description: category.description,
          display_order: category.display_order,
          is_active: category.is_active,
          items: items,
        });
      }
    });

    // Добавляем товары без категории
    const uncategorizedItems = categoryMap.get('uncategorized') || [];
    if (uncategorizedItems.length > 0) {
      menuByCategory.push({
        id: 'uncategorized',
        name: 'Без категории',
        items: uncategorizedItems,
      });
    }
  } else {
    // Если нет категорий, показываем все товары в одной категории
    if (regularItems.length > 0) {
      menuByCategory.push({
        id: 'all',
        name: 'Меню',
        items: regularItems,
      });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">←</span>
              <span className="text-lg font-semibold text-gray-900">Orqaga</span>
            </Link>
            <h1 className="text-lg font-bold text-gray-900 truncate flex-1 text-center mx-4">
              {restaurant.name}
            </h1>
            <div className="w-20"></div> {/* Spacer для центрирования */}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Restaurant Info */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          {restaurant.image_url && (
            <div className="relative w-full h-64">
              <Image
                src={restaurant.image_url}
                alt={restaurant.name}
                fill
                className="object-cover"
                unoptimized={shouldUnoptimizeImage(restaurant.image_url)}
              />
            </div>
          )}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{restaurant.name}</h2>
            {restaurant.description && (
              <p className="text-gray-600 mb-4">{restaurant.description}</p>
            )}
            {restaurant.phone && (
              <p className="text-sm text-gray-500">
                📞 {restaurant.phone}
              </p>
            )}
          </div>
        </div>

        {/* Banner Items */}
        {bannerItems.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-1 gap-4">
              {bannerItems.map((item) => (
                <MenuItemBanner key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Menu by Categories */}
        {menuByCategory.length > 0 ? (
          <div className="space-y-8">
            {menuByCategory
              .filter(category => category.is_active !== false)
              .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
              .map((category) => (
                <div key={category.id} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{category.name}</h3>
                  {category.description && (
                    <p className="text-gray-600 mb-4 text-sm">{category.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {category.items.map((item) => (
                      <MenuItem key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Меню пока пусто</p>
          </div>
        )}
      </div>

      {/* Cart */}
      <Cart
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        telegramBotUsername={TELEGRAM_BOT_USERNAME}
      />
    </div>
  );
}

