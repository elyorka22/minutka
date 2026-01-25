// ============================================
// API Client for Frontend
// ============================================

import axios from 'axios';
import { Restaurant, Order, Banner } from '../../shared/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Restaurants API
export async function getRestaurants(featured?: boolean): Promise<Restaurant[]> {
  const params = featured ? { featured: 'true' } : {};
  const response = await api.get<{ success: boolean; data: Restaurant[] }>('/api/restaurants', { params });
  return response.data.data;
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
  is_active?: boolean;
  is_featured?: boolean;
  admin_telegram_id?: number;
}): Promise<Restaurant> {
  const response = await api.post<{ success: boolean; data: Restaurant }>('/api/restaurants', restaurantData);
  return response.data.data;
}

export async function updateRestaurant(id: string, restaurantData: {
  name?: string;
  description?: string;
  phone?: string;
  image_url?: string;
  is_active?: boolean;
  is_featured?: boolean;
  working_hours?: Record<string, string>;
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
  user_id: string;
  order_text: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}): Promise<Order> {
  const response = await api.post<{ success: boolean; data: Order }>('/api/orders', orderData);
  return response.data.data;
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

// Banners API
export async function getBanners(position?: string): Promise<Banner[]> {
  const params = position ? { position } : {};
  const response = await api.get<{ success: boolean; data: Banner[] }>('/api/banners', { params });
  return response.data.data;
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

export async function createMenuItem(menuItemData: {
  restaurant_id: string;
  name: string;
  description?: string | null;
  price: number;
  category?: string | null;
  image_url?: string | null;
  is_available?: boolean;
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
  is_active?: boolean;
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

export async function deleteChef(id: string): Promise<void> {
  try {
    await api.delete(`/api/chefs/${id}`);
  } catch (error) {
    console.error('Error deleting chef:', error);
    throw error;
  }
}

// Orders API (for admin panels)
export async function getOrders(restaurantId?: string, archived: boolean = false): Promise<Order[]> {
  try {
    const params: any = {};
    if (restaurantId) {
      params.restaurant_id = restaurantId;
    }
    if (archived) {
      params.archived = 'true';
    }
    const response = await api.get<{ success: boolean; data: Order[] }>('/api/orders', { params });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

// Users API
export async function getUsers(): Promise<any[]> {
  try {
    const response = await api.get<{ success: boolean; data: any[] }>('/api/users');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
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

export async function getRestaurantStats(restaurantId: string): Promise<any> {
  try {
    const response = await api.get<{ success: boolean; data: any }>(`/api/stats/restaurant/${restaurantId}`);
    return response.data.data || null;
  } catch (error) {
    console.error('Error fetching restaurant stats:', error);
    return null;
  }
}

