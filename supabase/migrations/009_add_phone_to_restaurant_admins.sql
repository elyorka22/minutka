-- ============================================
-- Migration: Add phone field to restaurant_admins
-- ============================================

-- Добавляем поле phone в таблицу restaurant_admins
ALTER TABLE restaurant_admins ADD COLUMN IF NOT EXISTS phone VARCHAR(255);

