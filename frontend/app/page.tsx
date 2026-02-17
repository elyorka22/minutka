// ============================================
// Home Page - Главная страница (Server Component)
// ============================================

import { Suspense } from 'react';
import HomeClient from '@/components/HomeClient';
import {
  getRestaurantsServer,
  getStoresServer,
  getCategoriesServer,
  getRestaurantCategoryRelationsServer,
  getBannersServer,
  getPharmaciesStoresServer,
  getBotSettingsServer,
  getAllStoreCategoriesServer,
} from '@/lib/api-server';

// Экспортируем revalidate для ISR (Incremental Static Regeneration)
// Используем dynamic rendering для данных, которые могут меняться
export const dynamic = 'force-dynamic'; // Используем динамический рендеринг для актуальных данных

// Skeleton компоненты для загрузки
const SkeletonCard = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
    <div className="w-full h-48 bg-gray-200"></div>
    <div className="p-4">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

const SkeletonCategory = () => (
  <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-lg animate-pulse"></div>
);

// Компонент для загрузки данных
async function HomeData() {
  try {
    // Загружаем критичные данные параллельно на сервере
    const [categories, restaurantsResult, storesResult, relations, banners, pharmaciesStores, botSettings, storeCategories] =
      await Promise.all([
        getCategoriesServer(),
        getRestaurantsServer(undefined, undefined, undefined, 'restaurant'),
        getStoresServer(),
        getRestaurantCategoryRelationsServer(),
        getBannersServer('homepage').catch(() => []),
        getPharmaciesStoresServer(true).catch(() => []),
        getBotSettingsServer().catch(() => []),
        getAllStoreCategoriesServer().catch(() => []),
      ]);

    // Создаем карту связей категорий и ресторанов/магазинов
    const categoryRestaurantMap: { [categoryId: string]: string[] } = {};
    const categoryStoreMap: { [categoryId: string]: string[] } = {};
    
    if (relations && Array.isArray(relations)) {
      relations.forEach((rel: any) => {
        // Проверяем, является ли связанный ресторан рестораном или магазином
        const restaurant = restaurantsResult.data?.find((r: any) => r.id === rel.restaurant_id);
        const store = storesResult.data?.find((s: any) => s.id === rel.restaurant_id);
        
        if (restaurant && restaurant.type === 'restaurant') {
          // Это ресторан
          if (!categoryRestaurantMap[rel.category_id]) {
            categoryRestaurantMap[rel.category_id] = [];
          }
          categoryRestaurantMap[rel.category_id].push(rel.restaurant_id);
        } else if (store && store.type === 'store') {
          // Это магазин
          if (!categoryStoreMap[rel.category_id]) {
            categoryStoreMap[rel.category_id] = [];
          }
          categoryStoreMap[rel.category_id].push(rel.restaurant_id);
        }
      });
    }

    // Получаем слоган из настроек бота
    const appSloganSetting = botSettings?.find((s: any) => s.key === 'app_slogan');
    const appSlogan = appSloganSetting?.value || 'Tez va oson, uydan chiqmasdan';

    return (
      <HomeClient
        initialRestaurants={restaurantsResult.data || []}
        initialStores={storesResult.data || []}
        initialCategories={categories || []}
        initialBanners={banners || []}
        initialPharmaciesStores={pharmaciesStores || []}
        initialCategoryRestaurantMap={categoryRestaurantMap}
        initialCategoryStoreMap={categoryStoreMap}
        initialStoreCategories={storeCategories || []}
        appSlogan={appSlogan}
      />
    );
  } catch (error) {
    console.error('Error loading home page data:', error);
    // Возвращаем пустые данные в случае ошибки
    return (
      <HomeClient
        initialRestaurants={[]}
        initialStores={[]}
        initialCategories={[]}
        initialBanners={[]}
        initialPharmaciesStores={[]}
        initialCategoryRestaurantMap={{}}
        initialCategoryStoreMap={{}}
        initialStoreCategories={[]}
        appSlogan="Tez va oson, uydan chiqmasdan"
      />
    );
  }
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">🍽️ Minutka</h1>
                  <p className="text-sm text-gray-600">Tez va oson, uydan chiqmasdan</p>
                </div>
              </div>
            </div>
          </header>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
            <div className="grid grid-cols-1 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </section>
        </div>
      }
    >
      <HomeData />
    </Suspense>
  );
}
