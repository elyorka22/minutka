// ============================================
// Restaurant Menu Page - Telegram Web App
// ============================================

import { notFound } from 'next/navigation';
import { getRestaurantById, getMenuItems, getMenuCategories, MenuCategory as MenuCategoryType } from '@/lib/api';
import { MenuCategory, MenuItem as MenuItemType } from '@/lib/types';
import MenuPageClient from '@/components/MenuPageClient';

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'your_bot_username';

interface PageProps {
  params: {
    restaurantId: string;
  };
}

export default async function MenuPage({ params }: PageProps) {
  const [restaurant, menuItems, menuCategories] = await Promise.all([
    getRestaurantById(params.restaurantId).catch(() => null),
    getMenuItems(params.restaurantId, true),
    getMenuCategories(params.restaurantId, false).catch(() => [])
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

  // Если есть категории меню из БД, используем их для группировки
  if (menuCategories.length > 0) {
    // Создаем карту категорий для быстрого поиска
    const categoryMap = new Map<string, MenuItemType[]>();
    
    // Группируем блюда по названию категории (поле category в menu_items)
    regularItems.forEach((item) => {
      const categoryName = item.category || 'Без категории';
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, []);
      }
      categoryMap.get(categoryName)!.push(item);
    });

    // Создаем категории на основе данных из БД
    // Показываем все активные категории, даже если в них нет блюд
    menuCategories.forEach((dbCategory) => {
      if (dbCategory.is_active) {
        const items = categoryMap.get(dbCategory.name) || [];
        menuByCategory.push({ 
          name: dbCategory.name, 
          items,
          id: dbCategory.id,
          image_url: dbCategory.image_url,
          description: dbCategory.description
        });
      }
    });

    // Добавляем блюда без категории, если они есть
    const uncategorizedItems = categoryMap.get('Без категории') || [];
    if (uncategorizedItems.length > 0) {
      menuByCategory.push({ name: 'Без категории', items: uncategorizedItems });
    }
  } else {
    // Старая логика: группируем по полю category в menu_items
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
  }

  // Отслеживаем просмотр (делаем это на клиенте)
  return (
    <MenuPageClient
      restaurant={restaurant}
      bannerItems={bannerItems}
      menuByCategory={menuByCategory}
      menuCategories={menuCategories}
      restaurantId={params.restaurantId}
    />
  );
}

