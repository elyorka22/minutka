// ============================================
// Home Page - Главная страница
// ============================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getRestaurants, getBanners, getCategories } from '@/lib/api';
import RestaurantCard from '@/components/RestaurantCard';
import BannerCarousel from '@/components/BannerCarousel';
import RestaurantCategories from '@/components/RestaurantCategories';

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'your_bot_username';

export default function Home() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [featuredRestaurants, setFeaturedRestaurants] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [appSlogan, setAppSlogan] = useState('Telegram orqali ovqat yetkazib berish');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Загружаем все данные из API
        const [fetchedCategories, restaurantsResult, fetchedBanners, botSettingsResponse] = await Promise.all([
          getCategories(),
          getRestaurants(),
          getBanners('homepage'),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/bot-settings`).then(r => r.json()).catch(() => ({ data: [] }))
        ]);

        const fetchedRestaurants = restaurantsResult.data;
        setCategories(fetchedCategories);
        setRestaurants(fetchedRestaurants);
        setFeaturedRestaurants(fetchedRestaurants.filter(r => r.is_featured));
        setBanners(fetchedBanners);
        
        // Получаем слоган приложения и тексты баннера
        const appSloganSetting = botSettingsResponse.data?.find((s: any) => s.key === 'app_slogan');
        const bannerTitleSetting = botSettingsResponse.data?.find((s: any) => s.key === 'banner_title');
        const bannerSubtitleSetting = botSettingsResponse.data?.find((s: any) => s.key === 'banner_subtitle');
        
        if (appSloganSetting?.value) {
          setAppSlogan(appSloganSetting.value);
        }
        if (bannerTitleSetting?.value) {
          setBannerTitle(bannerTitleSetting.value);
        }
        if (bannerSubtitleSetting?.value) {
          setBannerSubtitle(bannerSubtitleSetting.value);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // В случае ошибки оставляем пустые массивы
        setCategories([]);
        setRestaurants([]);
        setFeaturedRestaurants([]);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Фильтрация ресторанов по категории
  const filteredRestaurants = selectedCategory
    ? restaurants.filter(r => r.category === selectedCategory)
    : restaurants;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Fixed on scroll */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🍽️ Minutka</h1>
              <p className="text-sm text-gray-600">{appSlogan}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm"
              >
                🔐 Kirish
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Top Banners Carousel */}
      {banners.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 py-8">
          <BannerCarousel banners={banners} />
        </section>
      )}

      {/* Restaurant Categories Carousel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Restoran kategoriyalari</h2>
        <RestaurantCategories
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          allCategoryImage={categories.find(c => c.name === 'Все' || c.name === 'Hammasi' || c.id === 'all')?.image_url}
        />
      </section>

      {/* Featured Restaurants (TOP) */}
      {!selectedCategory && featuredRestaurants.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">⭐ Top restoranlar</h2>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {featuredRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </section>
      )}

      {/* All Restaurants or Filtered by Category */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {selectedCategory
            ? `${categories.find(c => c.id === selectedCategory)?.name || 'Restoranlar'}`
            : '📋 Barcha restoranlar'}
        </h2>
        {filteredRestaurants.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Restoranlar topilmadi
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">© 2024 Minutka. Barcha huquqlar himoyalangan.</p>
        </div>
      </footer>
    </div>
  );
}
