// ============================================
// Home Client Component - Интерактивная часть главной страницы
// ============================================

'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Restaurant, RestaurantCategory } from '../../shared/types';
import RestaurantCard from './RestaurantCard';
import RestaurantCategories from './RestaurantCategories';
import PharmacyStoreCard from './PharmacyStoreCard';
import MenuItem from './MenuItem';
import { useAuth } from '@/contexts/AuthContext';
import { getMenuItems } from '@/lib/api';
import Cart from './Cart';
import { useCart } from '@/contexts/CartContext';

// Lazy loading для больших компонентов
const BannerCarousel = dynamic(() => import('./BannerCarousel'), {
  loading: () => (
    <section className="px-4 sm:px-6 lg:px-8 pt-2 pb-2">
      <div className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
    </section>
  ),
  ssr: false, // Баннеры не критичны для SEO
});

interface HomeClientProps {
  initialRestaurants: Restaurant[];
  initialStores: Restaurant[];
  initialCategories: RestaurantCategory[];
  initialBanners: any[];
  initialPharmaciesStores: any[];
  initialCategoryRestaurantMap: { [categoryId: string]: string[] };
  initialCategoryStoreMap: { [categoryId: string]: string[] };
  initialStoreCategories: any[]; // Категории магазинов (store_categories)
  initialStoreCategoryStoreMap: { [categoryName: string]: string[] }; // Карта: название категории -> массив ID магазинов
  appSlogan: string;
}

interface MenuItemWithStore {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  category: string | null;
  restaurant_id: string;
  is_banner: boolean;
  created_at: string;
  restaurant: {
    id: string;
    name: string;
    type: string;
    image_url: string | null;
  };
}

export default function HomeClient({
  initialRestaurants,
  initialStores,
  initialCategories,
  initialBanners,
  initialPharmaciesStores,
  initialCategoryRestaurantMap,
  initialCategoryStoreMap,
  initialStoreCategories,
  initialStoreCategoryStoreMap,
  appSlogan,
}: HomeClientProps) {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();
  const { items: cartItems } = useCart();
  // Вкладки: 'asosiy', 'do\'konlar', 'xizmatlar'
  const [selectedTab, setSelectedTab] = useState<'asosiy' | 'do\'konlar' | 'xizmatlar'>('asosiy');
  // По умолчанию категория "Все" (null означает "Все")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [banners, setBanners] = useState(initialBanners);
  const [pharmaciesStores, setPharmaciesStores] = useState(initialPharmaciesStores);
  
  // Фильтруем баннеры по текущей вкладке
  const currentTabBanners = useMemo(() => {
    return banners.filter(banner => {
      // Если position !== 'homepage', показываем на всех вкладках
      if (banner.position !== 'homepage') return true;
      // Для homepage баннеров фильтруем по вкладке
      return banner.tab === selectedTab || !banner.tab; // Если tab не указан, показываем на всех вкладках
    });
  }, [banners, selectedTab]);
  const [categoryItems, setCategoryItems] = useState<MenuItemWithStore[]>([]);
  const [loadingCategoryItems, setLoadingCategoryItems] = useState(false);
  const [allItems, setAllItems] = useState<MenuItemWithStore[]>([]);
  const [loadingAllItems, setLoadingAllItems] = useState(false);
  
  // Определяем, выбрана ли категория "Все" (Hammasi)
  const isAllCategory = useMemo(() => {
    if (!selectedCategory) return true;
    return initialStoreCategories.some(cat => 
      (cat.name === 'Все' || cat.name === 'Hammasi') && cat.name === selectedCategory
    );
  }, [selectedCategory, initialStoreCategories]);
  
  // Получаем restaurantId для корзины из первого товара в корзине или первого товара категории
  const cartRestaurantId = useMemo(() => {
    if (cartItems.length > 0 && cartItems[0].item.restaurant_id) {
      return cartItems[0].item.restaurant_id;
    }
    if (categoryItems.length > 0 && categoryItems[0].restaurant_id) {
      return categoryItems[0].restaurant_id;
    }
    // Если нет товаров, используем первый магазин
    return initialStores.length > 0 ? initialStores[0].id : '';
  }, [cartItems, categoryItems, initialStores]);
  
  // Получаем название магазина для корзины
  const cartRestaurantName = useMemo(() => {
    // Проверяем, являются ли товары в корзине товарами главной страницы
    const isMainPageCart = cartItems.some(cartItem => 
      (cartItem.item as any).is_main_page === true || 
      !cartItem.item.restaurant_id
    );
    
    if (isMainPageCart) {
      return 'Главная страница';
    }
    
    // Если есть товары в корзине, находим магазин по restaurant_id
    if (cartItems.length > 0 && cartItems[0].item.restaurant_id) {
      const store = initialStores.find(s => s.id === cartItems[0].item.restaurant_id);
      if (store) return store.name;
    }
    // Если есть товары категории, используем restaurant объект из MenuItemWithStore
    if (categoryItems.length > 0 && categoryItems[0].restaurant) {
      return categoryItems[0].restaurant.name;
    }
    // Если есть товары категории с restaurant_id, находим магазин
    if (categoryItems.length > 0 && categoryItems[0].restaurant_id) {
      const store = initialStores.find(s => s.id === categoryItems[0].restaurant_id);
      if (store) return store.name;
    }
    return initialStores.length > 0 ? initialStores[0].name : 'Online Bozor';
  }, [cartItems, categoryItems, initialStores]);

  // Находим категории аптек и магазинов
  const pharmaciesCategory = initialCategories.find(
    (c) =>
      c.name === 'Dorixonalar' ||
      c.name === 'Аптеки/Магазины' ||
      c.name === 'Pharmacies/Stores' ||
      c.id === 'pharmacies-stores'
  );

  const storesCategory = initialCategories.find(
    (c) =>
      c.name === "Do'konlar" ||
      c.name === 'Магазины' ||
      c.name === 'Stores' ||
      c.id === 'stores'
  );

  // Разделяем аптеки и магазины
  const pharmacies = useMemo(
    () =>
      pharmaciesStores.filter(
        (ps) =>
          ps.name?.toLowerCase().includes('apteka') ||
          ps.name?.toLowerCase().includes('аптека') ||
          ps.name?.toLowerCase().includes('pharmacy') ||
          ps.description?.toLowerCase().includes('apteka') ||
          ps.description?.toLowerCase().includes('аптека')
      ),
    [pharmaciesStores]
  );

  const stores = useMemo(
    () => pharmaciesStores.filter((ps) => !pharmacies.includes(ps)),
    [pharmaciesStores, pharmacies]
  );

  // Фильтрация ресторанов - удалено, оставляем только магазины
  const filteredRestaurants = useMemo(() => {
    const restaurants: Restaurant[] = [];
    return restaurants.filter((r) => {
      // Если выбрана категория аптек или магазинов, не показываем рестораны
      if (
        selectedCategory === 'pharmacies-stores' ||
        (pharmaciesCategory && selectedCategory === pharmaciesCategory.id) ||
        (storesCategory && selectedCategory === storesCategory.id)
      ) {
        return false;
      }
      // Фильтр по категории
      if (selectedCategory) {
        const restaurantIds = initialCategoryRestaurantMap[selectedCategory] || [];
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
  }, [initialRestaurants, selectedCategory, searchQuery, initialCategoryRestaurantMap, pharmaciesCategory, storesCategory]);

  // Фильтрация магазинов
  const filteredStores = useMemo(() => {
    const stores = initialStores;
    return stores.filter((s) => {
      // Если выбрана категория аптек или магазинов, не показываем магазины
      if (
        selectedCategory === 'pharmacies-stores' ||
        (pharmaciesCategory && selectedCategory === pharmaciesCategory.id) ||
        (storesCategory && selectedCategory === storesCategory.id)
      ) {
        return false;
      }
      // Фильтр по категории магазинов (store_categories)
      if (selectedCategory) {
        // Проверяем, является ли выбранная категория категорией магазинов
        const isStoreCategory = initialStoreCategories.some(cat => cat.name === selectedCategory);
        if (isStoreCategory) {
          // Фильтруем магазины, у которых есть товары с этой категорией
          const storeIds = initialStoreCategoryStoreMap[selectedCategory] || [];
          if (storeIds.length > 0 && !storeIds.includes(s.id)) {
            return false;
          }
        } else {
          // Старая логика для категорий ресторанов
          const storeIds = initialCategoryStoreMap[selectedCategory] || [];
          if (storeIds.length > 0 && !storeIds.includes(s.id)) {
            return false;
          }
        }
      }
      // Фильтр по поисковому запросу
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = s.name?.toLowerCase().includes(query);
        const descriptionMatch = s.description?.toLowerCase().includes(query);
        return nameMatch || descriptionMatch;
      }
      return true;
    });
  }, [initialStores, selectedCategory, searchQuery, initialCategoryStoreMap, pharmaciesCategory, storesCategory, initialStoreCategories, initialStoreCategoryStoreMap]);

  // Загружаем товары для вкладки "Asosiy"
  useEffect(() => {
    // Если выбрана вкладка "Asosiy"
    if (selectedTab === 'asosiy') {
      // Если выбрана категория (не "Все") - загружаем товары этой категории
      if (selectedCategory && !isAllCategory) {
        console.log('[HomeClient] Loading items for category:', selectedCategory);
        setLoadingCategoryItems(true);
        getMenuItems(undefined, true, selectedCategory)
          .then(items => {
            console.log('[HomeClient] Loaded category items:', items.length);
            setCategoryItems(items);
            setLoadingCategoryItems(false);
          })
          .catch(error => {
            console.error('[HomeClient] Error loading category items:', error);
            setCategoryItems([]);
            setLoadingCategoryItems(false);
          });
      } else {
        // Если выбрана "Все" или нет категории - загружаем все товары главной страницы
        console.log('[HomeClient] Loading all main page items for Asosiy tab');
        setLoadingAllItems(true);
        getMenuItems(undefined, true, undefined, true) // mainPage = true
          .then(items => {
            console.log('[HomeClient] Loaded all main page items:', items.length);
            setAllItems(items);
            setLoadingAllItems(false);
          })
          .catch(error => {
            console.error('[HomeClient] Error loading all main page items:', error);
            setAllItems([]);
            setLoadingAllItems(false);
          });
        setCategoryItems([]);
      }
    } else {
      // Для других вкладок очищаем товары
      setCategoryItems([]);
      setAllItems([]);
    }
  }, [selectedTab, selectedCategory, isAllCategory]);

  // Сбрасываем выбранную категорию, если она не подходит
  useEffect(() => {
    if (selectedCategory) {
      // Для магазинов проверяем, является ли это категорией магазинов (store_categories)
      const isStoreCategory = initialStoreCategories.some(cat => cat.name === selectedCategory);
      
      if (isStoreCategory) {
        // Это категория магазинов - не сбрасываем, даже если нет товаров
        // Товары могут быть загружены позже
        return;
      } else {
        // Если это не категория магазинов, сбрасываем
        setSelectedCategory(null);
      }
    }
  }, [selectedCategory, initialStoreCategories]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Fixed on scroll */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Online Bozor</h1>
              <p className="text-sm text-gray-600">{appSlogan}</p>
            </div>
            <div className="flex items-center gap-3">
              {selectedTab === 'asosiy' && isAllCategory ? (
                <button
                  onClick={async () => {
                    try {
                      // Получаем telegram_id из Telegram Web App или localStorage
                      const { getTelegramWebAppUser, getTelegramUserId } = await import('@/lib/telegram-webapp');
                      const webAppUser = getTelegramWebAppUser();
                      let telegramId: string | null = null;

                      if (webAppUser) {
                        telegramId = webAppUser.id.toString();
                        localStorage.setItem('telegram_id', telegramId);
                      } else {
                        telegramId = getTelegramUserId();
                      }

                      if (!telegramId) {
                        // Если telegram_id не найден, идем на страницу входа
                        router.push('/login');
                        return;
                      }

                      console.log('[HomeClient] Attempting automatic login with telegram_id:', telegramId);

                      // Используем функцию login из AuthContext для автоматического входа
                      // Это обеспечит правильное сохранение пользователя и автоматический редирект
                      await login(telegramId);
                    } catch (error: any) {
                      console.error('[HomeClient] Error during automatic login:', error);
                      // Если автоматический вход не удался (пользователь не найден или требуется пароль), идем на страницу входа
                      router.push('/login');
                    }
                  }}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm"
                >
                  Kirish
                </button>
              ) : selectedTab === 'asosiy' ? (
                <Cart
                  restaurantId={cartRestaurantId || 'main-page'} // Используем 'main-page' как идентификатор для товаров главной страницы
                  restaurantName={cartRestaurantName || 'Главная страница'}
                  telegramBotUsername={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || ''}
                  buttonPosition="header"
                />
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs - Asosiy, Do'konlar, Xizmatlar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => {
              setSelectedTab('asosiy');
              setSelectedCategory(null);
            }}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              selectedTab === 'asosiy'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Asosiy
          </button>
          <button
            onClick={() => {
              setSelectedTab('do\'konlar');
              setSelectedCategory(null);
            }}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              selectedTab === 'do\'konlar'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Do'konlar
          </button>
          <button
            onClick={() => {
              setSelectedTab('xizmatlar');
              setSelectedCategory(null);
            }}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              selectedTab === 'xizmatlar'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Xizmatlar
          </button>
        </div>
      </section>

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
            placeholder="Mahsulot qidirish..."
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
      {currentTabBanners.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-2">
          <BannerCarousel banners={currentTabBanners} />
        </section>
      )}

      {/* Store Categories Carousel - Категории магазинов под баннером (только для вкладки Asosiy) */}
      {selectedTab === 'asosiy' && initialStoreCategories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-2">
          <RestaurantCategories
            categories={initialStoreCategories.map(cat => ({
              id: cat.name, // Используем название как ID для единообразия
              name: cat.name,
              image_url: cat.image_url || '',
              is_active: true,
            }))}
            selectedCategory={selectedCategory}
            onCategorySelect={(categoryId) => {
              console.log('[HomeClient] Category selected:', categoryId);
              console.log('[HomeClient] Available categories:', initialStoreCategories.map(c => ({ id: c.id, name: c.name })));
              
              // Если выбрана категория "Все", сбрасываем фильтр
              if (categoryId === null || categoryId === 'all') {
                console.log('[HomeClient] Setting category to null (All)');
                setSelectedCategory(null);
                return;
              }
              
              // Ищем категорию по ID или названию
              // Важно: categoryId может быть либо UUID (cat.id), либо название (cat.name)
              const category = initialStoreCategories.find(c => 
                c.id === categoryId || 
                c.name === categoryId ||
                (c.id || c.name) === categoryId
              );
              
              console.log('[HomeClient] Found category:', category);
              
              if (category) {
                // Если это категория "Все", сбрасываем
                if (category.name === 'Все' || category.name === 'Hammasi') {
                  console.log('[HomeClient] Category is "All", setting to null');
                  setSelectedCategory(null);
                } else {
                  // ВАЖНО: Используем название категории для поиска товаров в API
                  // API ищет товары по полю category в таблице menu_items, которое содержит название категории
                  console.log('[HomeClient] Setting category to name:', category.name);
                  setSelectedCategory(category.name);
                }
              } else {
                // Если категория не найдена, возможно categoryId это уже название
                // Проверяем, есть ли категория с таким названием
                const categoryByName = initialStoreCategories.find(c => c.name === categoryId);
                if (categoryByName && categoryByName.name !== 'Все' && categoryByName.name !== 'Hammasi') {
                  console.log('[HomeClient] Found category by name, setting to:', categoryByName.name);
                  setSelectedCategory(categoryByName.name);
                } else {
                  console.warn('[HomeClient] Category not found, using categoryId as name:', categoryId);
                  setSelectedCategory(categoryId);
                }
              }
            }}
            allCategoryImage={
              initialStoreCategories.find(
                (c) => c.name === 'Все' || c.name === 'Hammasi' || c.name?.toLowerCase() === 'все' || c.name?.toLowerCase() === 'hammasi' || c.id === 'all'
              )?.image_url
            }
          />
        </section>
      )}

      {/* Tabs for Restaurants and Stores - временно скрыты, показываем только магазины */}
      {/* <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => {
              setSelectedTab('restaurants');
              setSelectedCategory(null);
            }}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              selectedTab === 'restaurants'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            🍽️ Restoranlar
          </button>
          <button
            onClick={() => {
              setSelectedTab('stores');
              setSelectedCategory(null);
            }}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              selectedTab === 'stores'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            🛒 Do'konlar
          </button>
        </div>
      </section> */}


      {/* All Restaurants or Filtered by Category - рестораны временно скрыты */}
      {/* {selectedCategory !== 'pharmacies-stores' &&
        !(pharmaciesCategory && selectedCategory === pharmaciesCategory.id) &&
        !(storesCategory && selectedCategory === storesCategory.id) && (
          <>
            {selectedTab === 'restaurants' && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {searchQuery
                    ? `🔍 Qidiruv natijalari: "${searchQuery}"`
                    : selectedCategory
                    ? `${initialCategories.find((c) => c.id === selectedCategory)?.name || 'Restoranlar'}`
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
          </>
        )} */}


      {/* Search Results */}
      {searchQuery && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🔍 Qidiruv natijalari: "{searchQuery}"
          </h2>
          {selectedTab === 'asosiy' ? (
            /* На вкладке Asosiy показываем товары при поиске */
            <div className="text-center py-12 text-gray-500">
              Qidiruv natijalari tez orada
            </div>
          ) : selectedTab === 'do\'konlar' ? (
            /* На вкладке Do'konlar показываем магазины при поиске */
            filteredStores.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Do'konlar topilmadi
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:gap-6">
                {filteredStores.map((store) => (
                  <RestaurantCard key={store.id} restaurant={store} />
                ))}
              </div>
            )
          ) : null}
        </section>
      )}

      {/* Pharmacies Section */}
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

      {/* Stores Section */}
      {stores.length > 0 &&
        storesCategory &&
        selectedCategory === storesCategory.id &&
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

