// ============================================
// Shared Types for Minutka Platform
// ============================================

// Restaurant types
export interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category?: string | null;
  working_hours: WorkingHours | null;
  telegram_chat_id: number | null;
  phone: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkingHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

// User types
export interface User {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

// Order types
export type OrderStatus = 'pending' | 'accepted' | 'ready' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  restaurant_id: string;
  user_id: string;
  order_text: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: OrderStatus;
  telegram_message_id: number | null;
  archived_at: string | null; // Дата архивации (устанавливается автоматически при статусе "delivered")
  created_at: string;
  updated_at: string;
}

export interface OrderWithDetails extends Order {
  restaurant: Restaurant;
  user: User;
}

// Banner types
export type BannerPosition = 'homepage' | 'restaurant_page' | 'recommended';

export interface Banner {
  id: string;
  restaurant_id: string | null;
  title: string | null;
  image_url: string;
  link_url: string | null;
  position: BannerPosition;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Chef types (повара)
export interface Chef {
  id: string;
  restaurant_id: string;
  telegram_id: number;
  telegram_chat_id: number | null; // Chat ID для получения уведомлений о заказах в боте
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Restaurant admin types (админы ресторана - создаются поварами)
export interface RestaurantAdmin {
  id: string;
  restaurant_id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Super admin types (супер-админы)
export interface SuperAdmin {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  password: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Menu item types
export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Telegram types
export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}

// Restaurant category types
export interface RestaurantCategory {
  id: string;
  name: string;
  image_url: string;
  display_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

