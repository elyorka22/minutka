-- ============================================
-- Migration: Allow NULL telegram_id in users table
-- ============================================

-- Изменяем поле telegram_id, чтобы оно могло быть NULL
ALTER TABLE users ALTER COLUMN telegram_id DROP NOT NULL;

-- Удаляем UNIQUE constraint, так как теперь может быть несколько NULL значений
-- Но оставляем уникальность для не-NULL значений
DROP INDEX IF EXISTS users_telegram_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_id_unique ON users(telegram_id) WHERE telegram_id IS NOT NULL;

