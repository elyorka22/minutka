// ============================================
// Home Page - Главная страница
// ============================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getRestaurants, getBanners, getCategories, getRestaurantCategoryRelations } from '@/lib/api';
import RestaurantCard from '@/components/RestaurantCard';
import BannerCarousel from '@/components/BannerCarousel';
import RestaurantCategories from '@/components/RestaurantCategories';
import SplashScreen from '@/components/SplashScreen';
import PharmacyStoreCard from '@/components/PharmacyStoreCard';
import { getPharmaciesStores } from '@/lib/api';

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
  const [categoryRestaurantMap, setCategoryRestaurantMap] = useState<{ [categoryId: string]: string[] }>({});
  const [showSplash, setShowSplash] = useState(false);
  const [pharmaciesStores, setPharmaciesStores] = useState<any[]>([]);

  // Проверяем, был ли уже показан splash screen в этой сессии
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const splashShown = sessionStorage.getItem('splashShown');
      if (!splashShown) {
        setShowSplash(true);
        sessionStorage.setItem('splashShown', 'true');
      }
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Загружаем все данные из API
        const [fetchedCategories, restaurantsResult, fetchedBanners, botSettingsResponse, fetchedPharmaciesStores] = await Promise.all([
          getCategories(),
          getRestaurants(),
          getBanners('homepage'),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}/api/bot-settings`).then(r => r.json()).catch(() => ({ data: [] })),
          getPharmaciesStores(true).catch(() => [])
        ]);

        const fetchedRestaurants = restaurantsResult.data;
        setCategories(fetchedCategories);
        setRestaurants(fetchedRestaurants);
        setFeaturedRestaurants(fetchedRestaurants.filter(r => r.is_featured));
        setBanners(fetchedBanners);
        setPharmaciesStores(fetchedPharmaciesStores);
        
        // Получаем слоган приложения
        const appSloganSetting = botSettingsResponse.data?.find((s: any) => s.key === 'app_slogan');
        
        if (appSloganSetting?.value) {
          setAppSlogan(appSloganSetting.value);
        }

        // Загружаем связи категорий и ресторанов
        const relationsMap: { [categoryId: string]: string[] } = {};
        for (const category of fetchedCategories || []) {
          const relations = await getRestaurantCategoryRelations(undefined, category.id);
          relationsMap[category.id] = relations.map((rel: any) => rel.restaurant_id);
        }
        setCategoryRestaurantMap(relationsMap);
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

  // Показываем splash screen при первой загрузке
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} isLoading={loading} />;
  }

  // Используем категории из базы данных
  const allCategories = categories;
  
  // Находим категорию "Dorixonalar" (Аптеки) в списке
  const pharmaciesCategory = categories.find(c => 
    c.name === 'Dorixonalar' || c.name === 'Аптеки/Магазины' || c.name === 'Pharmacies/Stores' || c.id === 'pharmacies-stores'
  );
  
  // Находим категорию "Do'konlar" (Магазины) в списке
  const storesCategory = categories.find(c => 
    c.name === 'Do\'konlar' || c.name === 'Магазины' || c.name === 'Stores' || c.id === 'stores'
  );
  
  // Разделяем аптеки и магазины (пока по названию, можно добавить поле type в будущем)
  const pharmacies = pharmaciesStores.filter(ps => 
    ps.name?.toLowerCase().includes('apteka') || 
    ps.name?.toLowerCase().includes('аптека') ||
    ps.name?.toLowerCase().includes('pharmacy') ||
    ps.description?.toLowerCase().includes('apteka') ||
    ps.description?.toLowerCase().includes('аптека')
  );
  const stores = pharmaciesStores.filter(ps => 
    !pharmacies.includes(ps)
  );

  // Фильтрация ресторанов по категории и поисковому запросу
  const filteredRestaurants = restaurants.filter((r) => {
    // Если выбрана категория аптек или магазинов, не показываем рестораны
    if (selectedCategory === 'pharmacies-stores' || 
        (pharmaciesCategory && selectedCategory === pharmaciesCategory.id) ||
        (storesCategory && selectedCategory === storesCategory.id)) {
      return false;
    }
    // Фильтр по категории (используем связи ресторан-категория)
    if (selectedCategory) {
      const restaurantIds = categoryRestaurantMap[selectedCategory] || [];
      if (!restaurantIds.includes(r.id)) {
        return false;
      }
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
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
        <section className="px-4 sm:px-6 lg:px-8 pt-2 pb-2">
          <BannerCarousel banners={banners} />
        </section>
      )}

      {/* Restaurant Categories Carousel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-2">
        <RestaurantCategories
          categories={allCategories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          allCategoryImage={categories.find(c => c.name === 'Все' || c.name === 'Hammasi' || c.id === 'all')?.image_url}
        />
      </section>

      {/* Featured Restaurants (TOP) */}
      {!selectedCategory && !searchQuery && featuredRestaurants.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">⭐ Top restoranlar</h2>
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            {featuredRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </section>
      )}

      {/* All Restaurants or Filtered by Category */}
      {selectedCategory !== 'pharmacies-stores' && 
       !(pharmaciesCategory && selectedCategory === pharmaciesCategory.id) &&
       !(storesCategory && selectedCategory === storesCategory.id) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {searchQuery
              ? `🔍 Qidiruv natijalari: "${searchQuery}"`
              : selectedCategory
              ? `${categories.find(c => c.id === selectedCategory)?.name || 'Restoranlar'}`
              : '📋 Barcha restoranlar'}
          </h2>
          {filteredRestaurants.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Restoranlar topilmadi
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:gap-6">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Pharmacies Section - показываем при выборе категории Dorixonalar или по умолчанию */}
      {pharmacies.length > 0 && 
       (!selectedCategory || 
        selectedCategory === 'pharmacies-stores' || 
        (pharmaciesCategory && selectedCategory === pharmaciesCategory.id)) && 
       !searchQuery && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">💊 Dorixonalar</h2>
          <div className="grid grid-cols-2 gap-4">
            {pharmacies.map((pharmacyStore) => (
              <PharmacyStoreCard key={pharmacyStore.id} pharmacyStore={pharmacyStore} />
            ))}
          </div>
        </section>
      )}

      {/* Stores Section - показываем при выборе категории Do'konlar */}
      {stores.length > 0 && 
       (storesCategory && selectedCategory === storesCategory.id) && 
       !searchQuery && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🛒 Do'konlar</h2>
          <div className="grid grid-cols-2 gap-4">
            {stores.map((pharmacyStore) => (
              <PharmacyStoreCard key={pharmacyStore.id} pharmacyStore={pharmacyStore} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
