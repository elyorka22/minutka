-- ============================================
-- Migration: Add order notification settings to restaurants
-- ============================================

-- Добавляем поля для управления уведомлениями о заказах
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS chef_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS admin_notifications_enabled BOOLEAN DEFAULT true;

-- Комментарии к полям
COMMENT ON COLUMN restaurants.chef_notifications_enabled IS 'Включены ли уведомления для поваров о новых заказах';
COMMENT ON COLUMN restaurants.admin_notifications_enabled IS 'Включены ли уведомления для админов ресторана о готовых заказах';

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_restaurants_chef_notifications_enabled ON restaurants(chef_notifications_enabled);
CREATE INDEX IF NOT EXISTS idx_restaurants_admin_notifications_enabled ON restaurants(admin_notifications_enabled);

