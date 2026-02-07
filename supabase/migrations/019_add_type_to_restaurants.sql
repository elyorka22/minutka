-- ============================================
-- Migration: Add type field to restaurants table
-- Allows restaurants to be either 'restaurant' or 'store'
-- Default is 'restaurant' for backward compatibility
-- ============================================

-- Добавляем поле type в таблицу restaurants
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'restaurant' CHECK (type IN ('restaurant', 'store'));

-- Добавляем индекс для быстрого поиска по типу
CREATE INDEX IF NOT EXISTS idx_restaurants_type ON restaurants(type);

-- Обновляем существующие записи (по умолчанию все рестораны)
UPDATE restaurants SET type = 'restaurant' WHERE type IS NULL;

-- Комментарий к полю
COMMENT ON COLUMN restaurants.type IS 'Тип заведения: restaurant (ресторан) или store (магазин). По умолчанию restaurant.';

