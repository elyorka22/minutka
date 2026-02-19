// ============================================
// Home Page - Главная страница (Server Component)
// ============================================

import { Suspense } from 'react';
import HomeClient from '@/components/HomeClient';
import {
  getStoresServer,
  getBannersServer,
  getPharmaciesStoresServer,
  getBotSettingsServer,
  getAllStoreCategoriesServer,
  getStoreCategoryStoreMapServer,
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
    const [storesResult, banners, pharmaciesStores, botSettings, storeCategories, storeCategoryStoreMap] =
      await Promise.all([
        getStoresServer(),
        getBannersServer('homepage').catch(() => []),
        getPharmaciesStoresServer(true).catch(() => []),
        getBotSettingsServer().catch(() => []),
        getAllStoreCategoriesServer().catch(() => []),
        getStoreCategoryStoreMapServer().catch(() => ({})),
      ]);

    // Получаем слоган из настроек бота
    const appSloganSetting = botSettings?.find((s: any) => s.key === 'app_slogan');
    const appSlogan = appSloganSetting?.value || 'Tez va oson, uydan chiqmasdan';

    return (
      <HomeClient
        initialRestaurants={[]}
        initialStores={storesResult.data || []}
        initialCategories={[]}
        initialBanners={banners || []}
        initialPharmaciesStores={pharmaciesStores || []}
        initialCategoryRestaurantMap={{}}
        initialCategoryStoreMap={{}}
        initialStoreCategories={storeCategories || []}
        initialStoreCategoryStoreMap={storeCategoryStoreMap || {}}
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
        initialStoreCategoryStoreMap={{}}
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
                  <h1 className="text-2xl font-bold text-gray-900">Online Bozor</h1>
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
