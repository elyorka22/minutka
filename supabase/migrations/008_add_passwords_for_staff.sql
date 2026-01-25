-- ============================================
-- Migration: Add password fields for staff (super_admins, restaurant_admins, chefs)
-- ============================================

-- Добавляем поле password в таблицу super_admins
ALTER TABLE super_admins ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Добавляем поле password в таблицу restaurant_admins
ALTER TABLE restaurant_admins ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Добавляем поле password в таблицу chefs
ALTER TABLE chefs ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Устанавливаем начальный пароль для существующих супер-админов (хеш от "123456")
-- ВАЖНО: Это временный хеш, нужно будет обновить через админ панель
-- Хеш bcrypt для "123456": $2b$10$rOzJqJqJqJqJqJqJqJqJqO (пример, нужно использовать реальный хеш)
-- Для безопасности лучше установить пароли через админ панель

