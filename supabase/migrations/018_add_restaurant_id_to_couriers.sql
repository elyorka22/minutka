-- ============================================
-- Migration: Add restaurant_id to couriers table
-- Allows couriers to be assigned to specific restaurants
-- If restaurant_id is NULL, courier is a general courier (sees all orders)
-- If restaurant_id is set, courier only sees orders from that restaurant
-- ============================================

-- Добавляем поле restaurant_id в таблицу couriers
ALTER TABLE couriers 
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL;

-- Добавляем индекс для быстрого поиска курьеров по ресторану
CREATE INDEX IF NOT EXISTS idx_couriers_restaurant_id ON couriers(restaurant_id) WHERE restaurant_id IS NOT NULL;

-- Добавляем индекс для поиска общих курьеров (restaurant_id IS NULL)
CREATE INDEX IF NOT EXISTS idx_couriers_general ON couriers(is_active) WHERE restaurant_id IS NULL;

-- Комментарий к полю
COMMENT ON COLUMN couriers.restaurant_id IS 'ID ресторана, к которому привязан курьер. Если NULL - общий курьер (видит все заказы). Если установлен - курьер видит только заказы своего ресторана.';

