-- ============================================
-- Migration: Add password field for staff authentication
-- ============================================

-- Добавляем поле password в таблицы для сотрудников
ALTER TABLE super_admins ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE restaurant_admins ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE chefs ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Устанавливаем начальный пароль для существующих супер-админов (123456)
-- В реальности пароль должен быть захеширован, но для простоты используем plain text
-- TODO: В продакшене использовать bcrypt или другой хеш
UPDATE super_admins SET password = '123456' WHERE password IS NULL;


