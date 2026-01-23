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
export async function getMenuItems(restaurantId: string): Promise<any[]> {
  try {
    const response = await api.get<{ success: boolean; data: any[] }>('/api/menu', { params: { restaurant_id: restaurantId } });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return [];
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

// Orders API (for admin panels)
export async function getOrders(restaurantId?: string): Promise<Order[]> {
  try {
    const params = restaurantId ? { restaurant_id: restaurantId } : {};
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

