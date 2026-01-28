-- ============================================
-- Migration: Add notifications_enabled field to restaurant_admins
-- ============================================

-- Добавляем поле notifications_enabled в таблицу restaurant_admins
-- По умолчанию уведомления включены (true)
ALTER TABLE restaurant_admins ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;

-- Обновляем существующие записи, чтобы у них были включены уведомления
UPDATE restaurant_admins SET notifications_enabled = true WHERE notifications_enabled IS NULL;

