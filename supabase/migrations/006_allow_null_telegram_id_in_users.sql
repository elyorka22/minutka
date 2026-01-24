-- ============================================
-- Migration: Allow NULL telegram_id in users table
-- ============================================

-- Удаляем UNIQUE constraint (если существует)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_telegram_id_key;

-- Изменяем поле telegram_id, чтобы оно могло быть NULL
ALTER TABLE users ALTER COLUMN telegram_id DROP NOT NULL;

-- Создаем частичный уникальный индекс для не-NULL значений
-- Это позволяет иметь несколько NULL значений, но сохраняет уникальность для не-NULL
CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_id_unique ON users(telegram_id) WHERE telegram_id IS NOT NULL;

