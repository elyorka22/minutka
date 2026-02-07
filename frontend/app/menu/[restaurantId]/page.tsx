// ============================================
// Restaurant Menu Page - Telegram Web App
// ============================================

import { notFound } from 'next/navigation';
import { getRestaurantById, getMenuItems } from '@/lib/api';
import MenuItem from '@/components/MenuItem';
import MenuItemBanner from '@/components/MenuItemBanner';
import { MenuCategory, MenuItem as MenuItemType } from '@/lib/types';
import { useEffect } from 'react';
import MenuPageClient from '@/components/MenuPageClient';

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'your_bot_username';

interface PageProps {
  params: {
    restaurantId: string;
  };
}

export default async function MenuPage({ params }: PageProps) {
  const [restaurant, menuItems] = await Promise.all([
    getRestaurantById(params.restaurantId).catch(() => null),
    getMenuItems(params.restaurantId, true)
  ]);

  if (!restaurant || !restaurant.is_active) {
    notFound();
  }

  // Группируем меню по категориям
  const menuByCategory: MenuCategory[] = [];
  const bannerItems: MenuItemType[] = [];
  const regularItems: MenuItemType[] = [];

  menuItems.forEach((item) => {
    if (item.is_banner) {
      bannerItems.push(item);
    } else {
      regularItems.push(item);
    }
  });

  // Группируем обычные элементы по категориям
  const categoryMap = new Map<string, MenuItemType[]>();
  regularItems.forEach((item) => {
    const category = item.category || 'Без категории';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(item);
  });

  categoryMap.forEach((items, category) => {
    menuByCategory.push({ name: category, items });
  });

  // Отслеживаем просмотр (делаем это на клиенте)
  return (
    <MenuPageClient
      restaurant={restaurant}
      bannerItems={bannerItems}
      menuByCategory={menuByCategory}
      restaurantId={params.restaurantId}
    />
  );
}

