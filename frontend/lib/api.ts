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

// Banners API
export async function getCategories(): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories?active=true`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function getBanners(position?: string): Promise<Banner[]> {
  const params = position ? { position } : {};
  const response = await api.get<{ success: boolean; data: Banner[] }>('/api/banners', { params });
  return response.data.data;
}

