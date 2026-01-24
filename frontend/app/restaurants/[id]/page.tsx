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

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-primary-600 hover:text-primary-700">
                ← Restoranlar ro'yxatiga qaytish
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

        {/* Restaurant Details */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            {/* Restaurant Image */}
            {restaurant.image_url && (
              <div className="relative w-full h-64 md:h-80 lg:h-96">
                <Image
                  src={restaurant.image_url}
                  alt={restaurant.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
                {restaurant.is_featured && (
                  <span className="text-yellow-500 text-2xl">⭐</span>
                )}
              </div>

            {restaurant.description && (
              <p className="text-gray-700 mb-6">{restaurant.description}</p>
            )}

            {/* Working Hours */}
            {restaurant.working_hours && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Ish vaqti:</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(restaurant.working_hours).map(([day, hours]) => (
                    <div key={day} className="text-sm">
                      <span className="font-medium capitalize">{day}:</span>{' '}
                      <span className="text-gray-600">{hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Info */}
            {restaurant.phone && (
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Telefon:</span> {restaurant.phone}
                </p>
              </div>
            )}

            {/* CTA Button */}
            <TableBookingButton
              restaurantId={restaurant.id}
              restaurantName={restaurant.name}
            />
            </div>
          </div>

          {/* Menu Section */}
          {menuByCategory.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🍽️ Menyu</h2>
              {menuByCategory.map((category) => (
                <div key={category.name} className="mb-8 last:mb-0">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b-2 border-primary-500 pb-2">
                    {category.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

