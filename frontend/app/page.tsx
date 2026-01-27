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
  const [searchQuery, setSearchQuery] = useState('');
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
        
        // Получаем слоган приложения
        const appSloganSetting = botSettingsResponse.data?.find((s: any) => s.key === 'app_slogan');
        
        if (appSloganSetting?.value) {
          setAppSlogan(appSloganSetting.value);
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

  // Фильтрация ресторанов по категории и поисковому запросу
  const filteredRestaurants = restaurants.filter((r) => {
    // Фильтр по категории
    if (selectedCategory && r.category !== selectedCategory) {
      return false;
    }
    // Фильтр по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const nameMatch = r.name?.toLowerCase().includes(query);
      const descriptionMatch = r.description?.toLowerCase().includes(query);
      return nameMatch || descriptionMatch;
    }
    return true;
  });

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

      {/* Search Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Restoran qidirish..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </section>

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
