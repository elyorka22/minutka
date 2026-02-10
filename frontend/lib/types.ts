// ============================================
// Local Types for Frontend
// ============================================

// Re-export types from shared for convenience
export * from '../../shared/types';

// Chef type (повар)
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

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null; // Категория не используется для блюд ресторана
  image_url: string | null;
  is_available: boolean;
  is_banner: boolean; // Помечает блюдо как баннер для большого отображения
  created_at: string;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
  id?: string;
  image_url?: string | null;
  description?: string | null;
}

