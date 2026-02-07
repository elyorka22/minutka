// ============================================
// API Client for Frontend
// ============================================

import axios from 'axios';
import { Restaurant, Order, Banner, WorkingHours, Courier } from '../../shared/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Функция для получения telegram_id из localStorage
function getTelegramId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('telegram_id');
}

// Interceptor для добавления telegram_id к запросам
api.interceptors.request.use((config) => {
  const telegramId = getTelegramId();
  if (telegramId) {
    // Добавляем telegram_id в заголовки для всех запросов
    config.headers['x-telegram-id'] = telegramId;
    
    // Также добавляем в query параметры для GET запросов (для обратной совместимости)
    if (config.method === 'get' || config.method === 'GET') {
      config.params = {
        ...config.params,
        telegram_id: telegramId,
      };
    } else {
      // Для POST/PATCH/DELETE добавляем в body (для обратной совместимости)
      // НО только если telegram_id еще не указан в body (чтобы не перезаписывать пользовательские данные)
      if (config.data && typeof config.data === 'object') {
        // Проверяем, есть ли уже telegram_id в body
        if (!config.data.telegram_id) {
          config.data = {
            ...config.data,
            telegram_id: telegramId,
          };
        }
      } else if (!config.data) {
        config.data = { telegram_id: telegramId };
      }
    }
  }
  return config;
});

// Interceptor для обработки ответов и автоматического logout при 401
api.interceptors.response.use(
  (response) => {
    // Обновляем время последней активности при успешном запросе
    if (typeof window !== 'undefined') {
      localStorage.setItem('last_activity', Date.now().toString());
    }
    return response;
  },
  (error) => {
    // Обработка 401 ошибки (Unauthorized)
    if (error.response?.status === 401) {
      // Очищаем данные пользователя
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('telegram_id');
        localStorage.removeItem('last_activity');
        
        // Перенаправляем на страницу входа
        // Используем window.location вместо router, так как мы не в React компоненте
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    // Обновляем время последней активности даже при ошибке (кроме 401)
    if (error.response?.status !== 401 && typeof window !== 'undefined') {
      localStorage.setItem('last_activity', Date.now().toString());
    }
    
    return Promise.reject(error);
  }
);

// Restaurants API
export async function getRestaurants(featured?: boolean, page?: number, limit?: number, type?: 'restaurant' | 'store'): Promise<{ data: Restaurant[]; pagination?: any }> {
  const params: any = {};
  if (featured) params.featured = 'true';
  if (page) params.page = page.toString();
  if (limit) params.limit = limit.toString();
  if (type) params.type = type;
  const response = await api.get<{ success: boolean; data: Restaurant[]; pagination?: any }>('/api/restaurants', { params });
  return { data: response.data.data, pagination: response.data.pagination };
}

// Stores API (alias для удобства)
export async function getStores(featured?: boolean, page?: number, limit?: number): Promise<{ data: Restaurant[]; pagination?: any }> {
  return getRestaurants(featured, page, limit, 'store');
}

export async function getRestaurantById(id: string): Promise<Restaurant> {
  const response = await api.get<{ success: boolean; data: Restaurant }>(`/api/restaurants/${id}`);
  return response.data.data;
}

export async function createRestaurant(restaurantData: {
  name: string;
  description?: string;
  phone?: string;
  image_url?: string;
  delivery_text?: string;
  is_active?: boolean;
  is_featured?: boolean;
  type?: 'restaurant' | 'store';
  admin_telegram_id?: number;
  admin_phone?: string;
  admin_password?: string;
}): Promise<Restaurant> {
  console.log('[API] createRestaurant called with:', restaurantData);
  const response = await api.post<{ success: boolean; data: Restaurant }>('/api/restaurants', restaurantData);
  console.log('[API] createRestaurant response:', response.data);
  return response.data.data;
}

export async function updateRestaurant(id: string, restaurantData: {
  name?: string;
  description?: string;
  phone?: string;
  image_url?: string;
  delivery_text?: string;
  menu_button_text?: string;
  is_active?: boolean;
  is_featured?: boolean;
  type?: 'restaurant' | 'store';
  working_hours?: WorkingHours | null;
}): Promise<Restaurant> {
  const response = await api.patch<{ success: boolean; data: Restaurant }>(`/api/restaurants/${id}`, restaurantData);
  return response.data.data;
}

export async function deleteRestaurant(id: string): Promise<void> {
  await api.delete(`/api/restaurants/${id}`);
}

// Orders API
export async function createOrder(orderData: {
  restaurant_id: string;
  user_id: string | null;
  user_telegram_id?: number;
  order_text: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}): Promise<Order> {
  try {
    const response = await api.post<{ success: boolean; data?: Order; error?: string; message?: string }>('/api/orders', orderData);
    
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to create order');
    }
    
    if (!response.data.data) {
      throw new Error('Order created but no data returned');
    }
    
    return response.data.data;
  } catch (error: any) {
    console.error('Error in createOrder API call:', error);
    
    // Если это ошибка от axios, извлекаем детали из response
    if (error.response) {
      const errorMessage = error.response.data?.error || error.response.data?.message || error.message;
      throw new Error(errorMessage);
    }
    
    throw error;
  }
}

export async function updateOrderStatus(orderId: string, status: string): Promise<Order> {
  try {
    const response = await api.patch<{ success: boolean; data: Order }>(`/api/orders/${orderId}/status`, { status });
    return response.data.data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

export async function assignOrderToGeneralCourier(orderId: string): Promise<Order> {
  try {
    const response = await api.post<{ success: boolean; data: Order }>(`/api/orders/${orderId}/assign-to-general-courier`);
    return response.data.data;
  } catch (error) {
    console.error('Error assigning order to general courier:', error);
    throw error;
  }
}

export async function assignOrderToRestaurantCourier(orderId: string): Promise<Order> {
  try {
    const response = await api.post<{ success: boolean; data: Order }>(`/api/orders/${orderId}/assign-to-restaurant-courier`);
    return response.data.data;
  } catch (error) {
    console.error('Error assigning order to restaurant courier:', error);
    throw error;
  }
}

export async function getOrderById(id: string): Promise<Order> {
  const response = await api.get<{ success: boolean; data: Order }>(`/api/orders/${id}`);
  return response.data.data;
}

// Categories API
export async function getCategories(): Promise<any[]> {
  try {
    const response = await api.get<{ success: boolean; data: any[] }>('/api/categories', { params: { active: true } });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Restaurant-Category Relations API
export async function getRestaurantCategoryRelations(restaurantId?: string, categoryId?: string): Promise<any[]> {
  try {
    const params: any = {};
    if (restaurantId) params.restaurant_id = restaurantId;
    if (categoryId) params.category_id = categoryId;
    const response = await api.get<{ success: boolean; data: any[] }>('/api/restaurant-category-relations', { params });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching restaurant-category relations:', error);
    return [];
  }
}

export async function createRestaurantCategoryRelation(restaurantId: string, categoryId: string): Promise<any> {
  const response = await api.post<{ success: boolean; data: any }>('/api/restaurant-category-relations', {
    restaurant_id: restaurantId,
    category_id: categoryId,
  });
  return response.data.data;
}

export async function deleteRestaurantCategoryRelation(id: string): Promise<void> {
  await api.delete(`/api/restaurant-category-relations/${id}`);
}

export async function deleteRestaurantCategoryRelationByIds(restaurantId: string, categoryId: string): Promise<void> {
  await api.delete('/api/restaurant-category-relations', {
    data: {
      restaurant_id: restaurantId,
      category_id: categoryId,
    },
  });
}

// Pharmacy/Store-Category Relations API
export async function getPharmacyStoreCategoryRelations(pharmacyStoreId?: string, categoryId?: string): Promise<any[]> {
  try {
    const params: any = {};
    if (pharmacyStoreId) params.pharmacy_store_id = pharmacyStoreId;
    if (categoryId) params.category_id = categoryId;
    const response = await api.get<{ success: boolean; data: any[] }>('/api/pharmacy-store-category-relations', { params });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching pharmacy-store-category relations:', error);
    return [];
  }
}

export async function createPharmacyStoreCategoryRelation(pharmacyStoreId: string, categoryId: string): Promise<any> {
  const response = await api.post<{ success: boolean; data: any }>('/api/pharmacy-store-category-relations', {
    pharmacy_store_id: pharmacyStoreId,
    category_id: categoryId,
  });
  return response.data.data;
}

export async function deletePharmacyStoreCategoryRelation(id: string): Promise<void> {
  await api.delete(`/api/pharmacy-store-category-relations/${id}`);
}

export async function deletePharmacyStoreCategoryRelationByIds(pharmacyStoreId: string, categoryId: string): Promise<void> {
  await api.delete('/api/pharmacy-store-category-relations', {
    data: {
      pharmacy_store_id: pharmacyStoreId,
      category_id: categoryId,
    },
  });
}

// Pharmacies/Stores API
export async function getPharmaciesStores(active?: boolean): Promise<any[]> {
  try {
    const params: any = {};
    if (active) params.active = 'true';
    const response = await api.get<{ success: boolean; data: any[] }>('/api/pharmacies-stores', { params });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching pharmacies/stores:', error);
    return [];
  }
}

export async function createPharmacyStore(pharmacyStoreData: {
  name: string;
  description?: string | null;
  phone: string;
  working_hours?: any;
  is_active?: boolean;
}): Promise<any> {
  const response = await api.post<{ success: boolean; data: any }>('/api/pharmacies-stores', pharmacyStoreData);
  return response.data.data;
}

export async function updatePharmacyStore(id: string, pharmacyStoreData: {
  name?: string;
  description?: string | null;
  phone?: string;
  working_hours?: any;
  is_active?: boolean;
}): Promise<any> {
  const response = await api.patch<{ success: boolean; data: any }>(`/api/pharmacies-stores/${id}`, pharmacyStoreData);
  return response.data.data;
}

export async function deletePharmacyStore(id: string): Promise<void> {
  await api.delete(`/api/pharmacies-stores/${id}`);
}

// Banners API
export async function getBanners(position?: string, all: boolean = false): Promise<Banner[]> {
  const params: any = {};
  if (position) params.position = position;
  if (all) params.all = 'true';
  const response = await api.get<{ success: boolean; data: Banner[] }>('/api/banners', { params });
  return response.data.data;
}

export async function createBanner(bannerData: {
  restaurant_id?: string | null;
  title?: string | null;
  image_url: string;
  link_url?: string | null;
  position?: 'homepage' | 'restaurant_page' | 'recommended';
  is_active?: boolean;
  display_order?: number;
}): Promise<Banner> {
  const response = await api.post<{ success: boolean; data: Banner }>('/api/banners', bannerData);
  return response.data.data;
}

export async function updateBanner(id: string, bannerData: {
  restaurant_id?: string | null;
  title?: string | null;
  image_url?: string;
  link_url?: string | null;
  position?: 'homepage' | 'restaurant_page' | 'recommended';
  is_active?: boolean;
  display_order?: number;
}): Promise<Banner> {
  const response = await api.patch<{ success: boolean; data: Banner }>(`/api/banners/${id}`, bannerData);
  return response.data.data;
}

export async function deleteBanner(id: string): Promise<void> {
  await api.delete(`/api/banners/${id}`);
}

// Menu Items API
export async function getMenuItems(restaurantId: string, includeUnavailable: boolean = false): Promise<any[]> {
  try {
    const params: any = { restaurant_id: restaurantId };
    if (includeUnavailable) {
      params.include_unavailable = 'true';
    }
    const response = await api.get<{ success: boolean; data: any[] }>('/api/menu', { params });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
}

// Track menu view for statistics
export async function trackMenuView(restaurantId: string, data?: {
  userAgent?: string;
  referer?: string;
  telegramUserId?: bigint;
}): Promise<void> {
  try {
    await api.post('/api/menu-views', {
      restaurant_id: restaurantId,
      user_agent: data?.userAgent,
      referer: data?.referer,
      telegram_user_id: data?.telegramUserId ? data.telegramUserId.toString() : undefined,
    });
  } catch (error) {
    console.error('Error tracking menu view:', error);
    // Не пробрасываем ошибку, чтобы не мешать пользователю
  }
}

// Get menu view statistics
export async function getMenuViewStatistics(restaurantId: string, startDate?: string, endDate?: string): Promise<any> {
  try {
    const params: any = { restaurant_id: restaurantId };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await api.get<{ success: boolean; data: any }>('/api/menu-views/statistics', { params });
    return response.data.data || {};
  } catch (error) {
    console.error('Error fetching menu view statistics:', error);
    return {};
  }
}

export async function createMenuItem(menuItemData: {
  restaurant_id: string;
  name: string;
  description?: string | null;
  price: number;
  category?: string | null;
  image_url?: string | null;
  is_available?: boolean;
  is_banner?: boolean;
}): Promise<any> {
  try {
    const response = await api.post<{ success: boolean; data: any }>('/api/menu', menuItemData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating menu item:', error);
    throw error;
  }
}

export async function updateMenuItem(id: string, menuItemData: {
  name?: string;
  description?: string | null;
  price?: number;
  category?: string | null;
  image_url?: string | null;
  is_available?: boolean;
  is_banner?: boolean;
}): Promise<any> {
  try {
    const response = await api.patch<{ success: boolean; data: any }>(`/api/menu/${id}`, menuItemData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw error;
  }
}

export async function deleteMenuItem(id: string): Promise<void> {
  try {
    await api.delete(`/api/menu/${id}`);
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw error;
  }
}

// Restaurant Admins API
export async function getRestaurantAdmins(restaurantId?: string): Promise<any[]> {
  try {
    const params = restaurantId ? { restaurant_id: restaurantId } : {};
    const response = await api.get<{ success: boolean; data: any[] }>('/api/restaurant-admins', { params });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching restaurant admins:', error);
    return [];
  }
}

export async function createRestaurantAdmin(adminData: {
  restaurant_id: string;
  telegram_id: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  is_active?: boolean;
  password: string;
}): Promise<any> {
  try {
    const response = await api.post<{ success: boolean; data: any }>('/api/restaurant-admins', adminData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating restaurant admin:', error);
    throw error;
  }
}

export async function updateRestaurantAdmin(id: string, adminData: {
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  is_active?: boolean;
  notifications_enabled?: boolean;
}): Promise<any> {
  try {
    const response = await api.patch<{ success: boolean; data: any }>(`/api/restaurant-admins/${id}`, adminData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating restaurant admin:', error);
    throw error;
  }
}

export async function deleteRestaurantAdmin(id: string): Promise<void> {
  try {
    await api.delete(`/api/restaurant-admins/${id}`);
  } catch (error) {
    console.error('Error deleting restaurant admin:', error);
    throw error;
  }
}

export async function getMyRestaurants(telegramId: string): Promise<any[]> {
  try {
    console.log('[API] getMyRestaurants called with telegram_id:', telegramId);
    const response = await api.get<{ success: boolean; data: any[] }>('/api/restaurant-admins/my-restaurants', {
      params: { telegram_id: telegramId }
    });
    console.log('[API] getMyRestaurants response:', response.data);
    return response.data.data || [];
  } catch (error: any) {
    console.error('[API] Error fetching my restaurants:', error);
    console.error('[API] Error details:', error.response?.data || error.message);
    return [];
  }
}

// Super Admins API
export async function getSuperAdmins(): Promise<any[]> {
  try {
    const response = await api.get<{ success: boolean; data: any[] }>('/api/super-admins');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching super admins:', error);
    return [];
  }
}

export async function createSuperAdmin(adminData: {
  telegram_id: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  password: string;
  is_active?: boolean;
}): Promise<any> {
  try {
    const response = await api.post<{ success: boolean; data: any }>('/api/super-admins', adminData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating super admin:', error);
    throw error;
  }
}

export async function updateSuperAdmin(id: string, adminData: {
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  password?: string;
  is_active?: boolean;
}): Promise<any> {
  try {
    const response = await api.patch<{ success: boolean; data: any }>(`/api/super-admins/${id}`, adminData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating super admin:', error);
    throw error;
  }
}

export async function deleteSuperAdmin(id: string): Promise<void> {
  try {
    await api.delete(`/api/super-admins/${id}`);
  } catch (error) {
    console.error('Error deleting super admin:', error);
    throw error;
  }
}

// Chefs API
export async function getChefs(restaurantId?: string): Promise<any[]> {
  try {
    const params = restaurantId ? { restaurant_id: restaurantId } : {};
    const response = await api.get<{ success: boolean; data: any[] }>('/api/chefs', { params });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching chefs:', error);
    return [];
  }
}

export async function createChef(chefData: {
  restaurant_id: string;
  telegram_id: number;
  telegram_chat_id: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  is_active?: boolean;
}): Promise<any> {
  try {
    const response = await api.post<{ success: boolean; data: any }>('/api/chefs', chefData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating chef:', error);
    throw error;
  }
}

export async function updateChef(id: string, chefData: {
  telegram_chat_id?: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  is_active?: boolean;
}): Promise<any> {
  try {
    const response = await api.patch<{ success: boolean; data: any }>(`/api/chefs/${id}`, chefData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating chef:', error);
    throw error;
  }
}

export async function changePassword(data: {
  telegram_id: string;
  old_password: string;
  new_password: string;
}): Promise<void> {
  try {
    const response = await api.post<{ success: boolean; message?: string; error?: string }>('/api/auth/change-password', data);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to change password');
    }
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
}

export async function deleteChef(id: string): Promise<void> {
  try {
    await api.delete(`/api/chefs/${id}`);
  } catch (error) {
    console.error('Error deleting chef:', error);
    throw error;
  }
}

// Orders API (for admin panels)
export async function getOrders(restaurantId?: string, archived: boolean = false, page?: number, limit?: number): Promise<{ data: Order[]; pagination?: any }> {
  try {
    const params: any = {};
    if (restaurantId) {
      params.restaurant_id = restaurantId;
    }
    if (archived) {
      params.archived = 'true';
    }
    if (page) params.page = page.toString();
    if (limit) params.limit = limit.toString();
    const response = await api.get<{ success: boolean; data: Order[]; pagination?: any }>('/api/orders', { params });
    return { data: response.data.data || [], pagination: response.data.pagination };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { data: [], pagination: undefined };
  }
}

// Users API
export async function getUsers(page?: number, limit?: number): Promise<{ data: any[]; pagination?: any }> {
  try {
    const params: any = {};
    if (page) params.page = page.toString();
    if (limit) params.limit = limit.toString();
    const response = await api.get<{ success: boolean; data: any[]; pagination?: any }>('/api/users', { params });
    return { data: response.data.data || [], pagination: response.data.pagination };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { data: [], pagination: undefined };
  }
}

// Stats API
export async function getStats(): Promise<any> {
  try {
    const response = await api.get<{ success: boolean; data: any }>('/api/stats');
    return response.data.data || null;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
}

export async function getRestaurantsStats(): Promise<Array<{
  restaurant_id: string;
  restaurant_name: string;
  is_active: boolean;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
}>> {
  const response = await api.get<{ success: boolean; data: any[]; error?: string }>('/api/stats/restaurants');
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to fetch restaurants stats');
  }
  return response.data.data;
}

export async function getRestaurantStats(restaurantId: string): Promise<any> {
  try {
    const response = await api.get<{ success: boolean; data: any }>(`/api/stats/restaurant/${restaurantId}`);
    return response.data.data || null;
  } catch (error) {
    console.error('Error fetching restaurant stats:', error);
    return null;
  }
}

// Couriers API
export async function getCouriers(): Promise<Courier[]> {
  try {
    const response = await api.get<{ success: boolean; data: Courier[] }>('/api/couriers');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching couriers:', error);
    throw error;
  }
}

export async function createCourier(courier: {
  telegram_id: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
}): Promise<Courier> {
  try {
    const response = await api.post<{ success: boolean; data: Courier }>('/api/couriers', courier);
    return response.data.data;
  } catch (error) {
    console.error('Error creating courier:', error);
    throw error;
  }
}

export async function updateCourier(id: string, courier: {
  telegram_id?: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  is_active?: boolean;
}): Promise<Courier> {
  try {
    const response = await api.put<{ success: boolean; data: Courier }>(`/api/couriers/${id}`, courier);
    return response.data.data;
  } catch (error) {
    console.error('Error updating courier:', error);
    throw error;
  }
}

export async function deleteCourier(id: string): Promise<void> {
  try {
    await api.delete(`/api/couriers/${id}`);
  } catch (error) {
    console.error('Error deleting courier:', error);
    throw error;
  }
}

