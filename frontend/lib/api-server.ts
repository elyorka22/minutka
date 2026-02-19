// ============================================
// Server-side API Client for Next.js Server Components
// ============================================

import { Restaurant, RestaurantCategory, Banner, PharmacyStore } from '../../shared/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// Функция для получения данных на сервере с кэшированием
async function fetchWithCache<T>(
  url: string,
  options: RequestInit = {},
  revalidate: number = 60 // Кэшируем на 60 секунд по умолчанию
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    next: { revalidate }, // Next.js кэширование
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || data;
}

// Restaurants API (server-side)
export async function getRestaurantsServer(
  featured?: boolean,
  page?: number,
  limit?: number,
  type?: 'restaurant' | 'store'
): Promise<{ data: Restaurant[]; pagination?: any }> {
  const params = new URLSearchParams();
  if (featured) params.append('featured', 'true');
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());
  if (type) params.append('type', type);

  const url = `${API_BASE_URL}/api/restaurants${params.toString() ? `?${params.toString()}` : ''}`;
  const data = await fetchWithCache<Restaurant[]>(url, {}, 60); // Кэш 60 секунд
  return { data: Array.isArray(data) ? data : [], pagination: null };
}

// Stores API (server-side)
export async function getStoresServer(
  featured?: boolean,
  page?: number,
  limit?: number
): Promise<{ data: Restaurant[]; pagination?: any }> {
  return getRestaurantsServer(featured, page, limit, 'store');
}

// Categories API (server-side)
// Для публичного доступа возвращаем только активные категории
export async function getCategoriesServer(): Promise<RestaurantCategory[]> {
  const url = `${API_BASE_URL}/api/categories?active=true`;
  // Уменьшаем кэш до 30 секунд для более быстрого обновления при деактивации категорий
  const data = await fetchWithCache<RestaurantCategory[]>(url, {}, 30);
  // Дополнительная фильтрация на случай, если API вернет неактивные категории
  return Array.isArray(data) ? data.filter(cat => cat.is_active !== false) : [];
}

// Restaurant Category Relations API (server-side)
export async function getRestaurantCategoryRelationsServer(
  categoryId?: string,
  restaurantId?: string
): Promise<any[]> {
  const params = new URLSearchParams();
  if (categoryId) params.append('category_id', categoryId);
  if (restaurantId) params.append('restaurant_id', restaurantId);

  const url = `${API_BASE_URL}/api/restaurant-category-relations${params.toString() ? `?${params.toString()}` : ''}`;
  const data = await fetchWithCache<any[]>(url, {}, 60); // Кэш 60 секунд
  return Array.isArray(data) ? data : [];
}

// Banners API (server-side)
export async function getBannersServer(position: string): Promise<Banner[]> {
  const url = `${API_BASE_URL}/api/banners?position=${position}`;
  const data = await fetchWithCache<Banner[]>(url, {}, 30); // Кэш 30 секунд
  return Array.isArray(data) ? data : [];
}

// Pharmacies/Stores API (server-side)
export async function getPharmaciesStoresServer(active?: boolean): Promise<PharmacyStore[]> {
  const params = new URLSearchParams();
  if (active) params.append('active', 'true');

  const url = `${API_BASE_URL}/api/pharmacies-stores${params.toString() ? `?${params.toString()}` : ''}`;
  const data = await fetchWithCache<PharmacyStore[]>(url, {}, 60); // Кэш 60 секунд
  return Array.isArray(data) ? data : [];
}

// Bot Settings API (server-side)
export async function getBotSettingsServer(): Promise<any[]> {
  const url = `${API_BASE_URL}/api/bot-settings`;
  const data = await fetchWithCache<any[]>(url, {}, 300); // Кэш 5 минут
  return Array.isArray(data) ? data : [];
}

// Store Categories API (server-side) - получить все категории магазинов
export async function getAllStoreCategoriesServer(): Promise<any[]> {
  try {
    // Загружаем все активные категории напрямую из БД, независимо от наличия магазинов
    const url = `${API_BASE_URL}/api/store-categories?all=true`;
    const categories = await fetchWithCache<any[]>(url, {}, 60);
    
    if (!Array.isArray(categories)) {
      return [];
    }
    
    // Группируем по названию - если категория с таким названием уже есть, берем первую
    const categoryMap = new Map<string, any>();
    
    categories.forEach((cat) => {
      if (cat.is_active) {
        // Группируем по названию - если категория с таким названием уже есть, берем первую
        if (!categoryMap.has(cat.name)) {
          categoryMap.set(cat.name, {
            id: cat.name, // Используем название как ID для фильтрации
            name: cat.name,
            image_url: cat.image_url,
            description: cat.description,
          });
        }
      }
    });
    
    return Array.from(categoryMap.values());
  } catch (error) {
    console.error('Error fetching all store categories:', error);
    return [];
  }
}

// Store Category Store Map - создать карту: какая категория товаров есть в каком магазине
export async function getStoreCategoryStoreMapServer(): Promise<{ [categoryName: string]: string[] }> {
  // Загружаем все магазины
  const storesResult = await getStoresServer();
  const stores = storesResult.data || [];
  
  // Карта: название категории -> массив ID магазинов, у которых есть товары этой категории
  const categoryStoreMap: { [categoryName: string]: string[] } = {};
  
  for (const store of stores) {
    try {
      // Загружаем товары магазина
      const url = `${API_BASE_URL}/api/menu?restaurant_id=${store.id}`;
      const menuItems = await fetchWithCache<any[]>(url, {}, 60);
      
      if (Array.isArray(menuItems)) {
        // Собираем уникальные категории товаров этого магазина
        const storeCategories = new Set<string>();
        menuItems.forEach((item) => {
          if (item.category && item.category.trim()) {
            storeCategories.add(item.category.trim());
          }
        });
        
        // Добавляем магазин в карту для каждой категории
        storeCategories.forEach((categoryName) => {
          if (!categoryStoreMap[categoryName]) {
            categoryStoreMap[categoryName] = [];
          }
          if (!categoryStoreMap[categoryName].includes(store.id)) {
            categoryStoreMap[categoryName].push(store.id);
          }
        });
      }
    } catch (error) {
      // Игнорируем ошибки для отдельных магазинов
      console.error(`Error fetching menu items for store ${store.id}:`, error);
    }
  }
  
  return categoryStoreMap;
}

// Store Carousels API (server-side) - получить карусели магазина
export async function getStoreCarouselsServer(restaurantId: string): Promise<any[]> {
  const url = `${API_BASE_URL}/api/store-carousels?restaurant_id=${restaurantId}`;
  const carousels = await fetchWithCache<any[]>(url, {}, 60);
  return Array.isArray(carousels) ? carousels.filter(c => c.is_active) : [];
}

// Store Carousel Items API (server-side) - получить товары карусели
export async function getStoreCarouselItemsServer(carouselId: string): Promise<any[]> {
  const url = `${API_BASE_URL}/api/store-carousels/${carouselId}/items`;
  const data = await fetchWithCache<any[]>(url, {}, 60);
  return Array.isArray(data) ? data : [];
}

