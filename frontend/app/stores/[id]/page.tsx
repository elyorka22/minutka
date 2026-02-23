// ============================================
// Store Detail Page - Страница магазина
// ============================================

import { notFound } from 'next/navigation';
import { getRestaurantById, getBanners, getMenuItems } from '@/lib/api';
import { getStoreCarouselsServer, getStoreCarouselItemsServer } from '@/lib/api-server';
import Link from 'next/link';
import Image from 'next/image';
import MenuItemBanner from '@/components/MenuItemBanner';
import MenuItem from '@/components/MenuItem';
import Cart from '@/components/Cart';
import StoreItemsCarousel from '@/components/StoreItemsCarousel';
import { MenuItem as MenuItemType } from '@/lib/types';

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'your_bot_username';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function StorePage({ params }: PageProps) {
  // Загружаем данные из API
  // Получаем все товары, включая недоступные, чтобы показать их серыми
  const [store, recommendedBanners, menuItems, storeCarousels] = await Promise.all([
    getRestaurantById(params.id).catch(() => null),
    getBanners('recommended'),
    getMenuItems(params.id, true), // includeUnavailable = true
    getStoreCarouselsServer(params.id).catch(() => []), // Загружаем карусели из БД
  ]);

  if (!store || store.type !== 'store') {
    notFound();
  }

  // Разделяем товары на баннеры и обычные
  const bannerItems = menuItems.filter((item: MenuItemType) => item.is_banner === true);
  const regularItems = menuItems.filter((item: MenuItemType) => !item.is_banner);

  // Загружаем товары для каждой карусели
  const carouselGroups: { carousel: any; items: MenuItemType[] }[] = [];
  
  for (const carousel of storeCarousels) {
    try {
      const carouselItemsData = await getStoreCarouselItemsServer(carousel.id);
      
      // Извлекаем menu_item_id из данных карусели
      // Supabase JOIN возвращает menu_items как вложенный объект
      const carouselItemIds = new Set<string>();
      
      for (const item of carouselItemsData) {
        let menuItemId: string | null = null;
        
        // Проверяем вложенный объект menu_items (результат JOIN)
        if (item.menu_items && typeof item.menu_items === 'object' && item.menu_items.id) {
          menuItemId = String(item.menu_items.id);
        }
        // Иначе берем menu_item_id напрямую
        else if (item.menu_item_id) {
          menuItemId = String(item.menu_item_id);
        }
        
        if (menuItemId) {
          carouselItemIds.add(menuItemId);
        }
      }
      
      // Фильтруем товары из всех товаров (включая баннеры, если они в карусели)
      // Используем все menuItems, а не только regularItems, чтобы не пропустить товары
      const itemsInCarousel = menuItems.filter(item => {
        const itemId = String(item.id);
        return carouselItemIds.has(itemId);
      });
      
      // Добавляем карусель, даже если товаров нет (чтобы показать пустую карусель)
      carouselGroups.push({
        carousel,
        items: itemsInCarousel,
      });
    } catch (error) {
      console.error(`Error loading items for carousel ${carousel.id}:`, error);
      // Добавляем карусель даже при ошибке, но без товаров
      carouselGroups.push({
        carousel,
        items: [],
      });
    }

  // Собираем все ID товаров, которые уже в каруселях
  const carouselItemIds = new Set<string>();
  carouselGroups.forEach(group => {
    group.items.forEach(item => {
      carouselItemIds.add(String(item.id));
    });
  });

  // Фильтруем обычные товары, исключая те, что уже в каруселях
  const regularItemsNotInCarousels = regularItems.filter(item => {
    const itemId = String(item.id);
    return !carouselItemIds.has(itemId);
  });

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

          {/* Regular Menu Section - Товары в каруселях из БД */}
          {carouselGroups.map((group, index) => (
            <div key={group.carousel.id} className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{group.carousel.name}</h2>
              <StoreItemsCarousel items={group.items} carouselIndex={index} />
            </div>
          ))}

          {/* Regular Items Section - Обычные товары, не в каруселях */}
          {regularItemsNotInCarousels.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Mahsulotlar</h2>
              <div className="grid grid-cols-2 gap-4">
                {regularItemsNotInCarousels.map((item) => (
                  <MenuItem key={item.id} item={item} />
                ))}
              </div>
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

