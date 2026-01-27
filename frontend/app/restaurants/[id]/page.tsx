// ============================================
// Restaurant Detail Page
// ============================================

import { notFound } from 'next/navigation';
import { getRestaurantById, getBanners, getMenuItems } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import MenuItem from '@/components/MenuItem';
import Cart from '@/components/Cart';
import { MenuCategory, MenuItem as MenuItemType } from '@/lib/types';
import TableBookingButton from '@/components/TableBookingButton';

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'your_bot_username';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function RestaurantPage({ params }: PageProps) {
  // Загружаем данные из API
  const [restaurant, recommendedBanners, menuItems] = await Promise.all([
    getRestaurantById(params.id).catch(() => null),
    getBanners('recommended'),
    getMenuItems(params.id)
  ]);

  if (!restaurant) {
    notFound();
  }

  // Группируем меню по категориям (если категории есть) или показываем все блюда
  const menuByCategory: MenuCategory[] = [];
  if (menuItems.length > 0) {
    // Если у всех блюд категория null, просто показываем все в одной группе
    const hasCategories = menuItems.some(item => item.category !== null);
    
    if (!hasCategories) {
      // Все блюда без категорий - показываем в одной группе "Меню"
      menuByCategory.push({ name: 'Меню', items: menuItems });
    } else {
      // Группируем по категориям, игнорируя блюда с null категорией
      menuItems.forEach((item: MenuItemType) => {
        if (item.category === null) {
          // Блюда без категории добавляем в группу "Меню"
          const defaultCategory = menuByCategory.find(c => c.name === 'Меню');
          if (defaultCategory) {
            defaultCategory.items.push(item);
          } else {
            menuByCategory.push({ name: 'Меню', items: [item] });
          }
        } else {
          const category = menuByCategory.find(c => c.name === item.category);
          if (category) {
            category.items.push(item);
          } else {
            menuByCategory.push({ name: item.category, items: [item] });
          }
        }
      });
    }
  }

    // Получаем текущее время и определяем, когда ресторан закроется
    const getClosingTime = () => {
      if (!restaurant.working_hours) return null;
      
      const today = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDay = dayNames[today.getDay()];
      const todayHours = restaurant.working_hours[currentDay as keyof typeof restaurant.working_hours];
      
      if (todayHours && typeof todayHours === 'string') {
        // Формат: "09:00-22:00"
        const parts = todayHours.split('-');
        if (parts.length === 2) {
          return parts[1]; // Возвращаем время закрытия
        }
      }
      return null;
    };

    const closingTime = getClosingTime();

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
                restaurantId={restaurant.id}
                restaurantName={restaurant.name}
                telegramBotUsername={TELEGRAM_BOT_USERNAME}
                buttonPosition="header"
              />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Restaurant Name - по центру */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
            {restaurant.name}
          </h1>

          {/* Description - под названием */}
          {restaurant.description && (
            <p className="text-gray-700 text-base md:text-lg mb-4 text-center">
              {restaurant.description}
            </p>
          )}

          {/* Closing Time - до скольки открыто */}
          {closingTime && (
            <div className="mb-4 text-center">
              <p className="text-sm md:text-base text-gray-600">
                <span className="font-medium">Ochiladi:</span> {closingTime} gacha
              </p>
            </div>
          )}

          {/* Delivery Info - как доставляется */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
            <p className="text-sm md:text-base text-gray-700">
              <span className="font-medium">Yetkazib berish:</span> Telegram-bot orqali buyurtma bering
            </p>
          </div>

          {/* Menu Section */}
          {menuByCategory.length > 0 && (
            <div className="mb-8">
              {menuByCategory.map((category) => (
                <div key={category.name} className="mb-8 last:mb-0">
                  {menuByCategory.length > 1 && (
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      {category.name}
                    </h2>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {category.items.map((item) => (
                      <MenuItem key={item.id} item={item} />
                    ))}
                  </div>
                </div>
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

