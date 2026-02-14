// ============================================
// Store Detail Page - Страница магазина
// ============================================

import { notFound } from 'next/navigation';
import { getRestaurantById, getBanners, getMenuItems, getStoreCategories } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import MenuItem from '@/components/MenuItem';
import MenuItemBanner from '@/components/MenuItemBanner';
import Cart from '@/components/Cart';
import CategoryCarousel from '@/components/CategoryCarousel';
import { MenuCategory, MenuItem as MenuItemType } from '@/lib/types';
import TableBookingButton from '@/components/TableBookingButton';

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'your_bot_username';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function StorePage({ params }: PageProps) {
  // Загружаем данные из API
  // Получаем все товары, включая недоступные, чтобы показать их серыми
  const [store, recommendedBanners, menuItems, storeCategories] = await Promise.all([
    getRestaurantById(params.id).catch(() => null),
    getBanners('recommended'),
    getMenuItems(params.id, true), // includeUnavailable = true
    getStoreCategories(params.id, false).catch(() => []) // Получаем активные категории магазина
  ]);

  if (!store || store.type !== 'store') {
    notFound();
  }

  // Разделяем товары на баннеры и обычные
  const bannerItems = menuItems.filter((item: MenuItemType) => item.is_banner === true);
  const regularItems = menuItems.filter((item: MenuItemType) => !item.is_banner);

  // Группируем обычные товары по категориям из БД
  const menuByCategory: MenuCategory[] = [];
  
  // Если есть категории магазина из БД, используем их для группировки
  if (storeCategories.length > 0) {
    // Создаем карту категорий для быстрого поиска
    const categoryMap = new Map<string, MenuItemType[]>();
    
    // Группируем товары по названию категории (поле category в menu_items)
    regularItems.forEach((item) => {
      const categoryName = item.category || 'Без категории';
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, []);
      }
      categoryMap.get(categoryName)!.push(item);
    });

    // Создаем категории на основе данных из БД
    // Показываем все активные категории, даже если в них нет товаров
    storeCategories.forEach((dbCategory) => {
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

    // Добавляем товары без категории, если они есть
    const uncategorizedItems = categoryMap.get('Без категории') || [];
    if (uncategorizedItems.length > 0) {
      menuByCategory.push({ name: 'Без категории', items: uncategorizedItems });
    }
  } else {
    // Старая логика: группируем по полю category в menu_items
    if (regularItems.length > 0) {
      const categoryMap = new Map<string, MenuItemType[]>();
      regularItems.forEach((item) => {
        const category = item.category || 'Товары';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, []);
        }
        categoryMap.get(category)!.push(item);
      });

      categoryMap.forEach((items, category) => {
        menuByCategory.push({ name: category, items });
      });
    }
  }

    // Форматируем время работы для отображения
    const formatWorkingHours = () => {
      if (!store.working_hours) return null;
      
      const { start_day, end_day, start_time, end_time, closed_days } = store.working_hours;
      
      if (!start_day || !end_day || !start_time || !end_time) {
        return null;
      }
      
      let result = `${start_day} dan ${end_day} gacha ${start_time} dan ${end_time} gacha`;
      
      if (closed_days && closed_days.length > 0) {
        result += `. ${closed_days.join(', ')} yopiq`;
      }
      
      return result;
    };

    const workingHoursText = formatWorkingHours();

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-primary-600 hover:text-primary-700">
                ← Orqaga
              </Link>
              <Cart
                restaurantId={store.id}
                restaurantName={store.name}
                telegramBotUsername={TELEGRAM_BOT_USERNAME}
                buttonPosition="header"
              />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Store Name - по центру */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
            {store.name}
          </h1>

          {/* Description - под названием */}
          {store.description && (
            <p className="text-gray-700 text-base md:text-lg mb-4 text-center">
              {store.description}
            </p>
          )}

          {/* Working Hours - время работы над описанием о доставке */}
          {workingHoursText && (
            <div className="mb-4 text-center">
              <p className="text-sm md:text-base text-gray-600">
                {workingHoursText}
              </p>
            </div>
          )}

          {/* Delivery Info - как доставляется */}
          {store.delivery_text && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
              <p className="text-sm md:text-base text-gray-700">
                <span className="font-medium">Yetkazib berish:</span> {store.delivery_text}
              </p>
            </div>
          )}

          {/* Banner Items Section - Большие баннеры для товаров */}
          {bannerItems.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Tavsiya etamiz</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bannerItems.map((item) => (
                  <MenuItemBanner key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Regular Menu Section - Обычные карточки товаров в виде горизонтальных каруселей */}
          {menuByCategory.length > 0 && (
            <div className="mb-8">
              {menuByCategory.map((category, categoryIndex) => (
                <CategoryCarousel 
                  key={category.name} 
                  category={category} 
                  categoryIndex={categoryIndex}
                />
              ))}
            </div>
          )}

          {/* Recommended Banners */}
          {recommendedBanners.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Bugun tavsiya etamiz</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendedBanners.map((banner) => (
                  <div key={banner.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    {banner.image_url && (
                      <div className="relative w-full h-32">
                        <Image
                          src={banner.image_url}
                          alt={banner.title || 'Banner'}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    {banner.title && (
                      <div className="p-4">
                        <p className="font-semibold text-gray-900">{banner.title}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

