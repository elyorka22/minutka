-- ============================================
-- Migration: Add Super Admins Table
-- ============================================

-- Создаем таблицу super_admins
CREATE TABLE IF NOT EXISTS super_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_super_admins_telegram_id ON super_admins(telegram_id);
CREATE INDEX IF NOT EXISTS idx_super_admins_is_active ON super_admins(is_active);

-- Добавляем триггер для updated_at
CREATE TRIGGER update_super_admins_updated_at BEFORE UPDATE ON super_admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Включаем RLS
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- RLS политики (только через service role для записи)
-- Просмотр только через service role


