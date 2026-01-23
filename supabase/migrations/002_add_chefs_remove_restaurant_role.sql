-- ============================================
-- Migration: Add Chefs, Remove Restaurant Role
-- ============================================

-- Удаляем таблицу restaurant_admins (будет заменена на chefs)
DROP TABLE IF EXISTS restaurant_admins CASCADE;

-- Создаем таблицу chefs (повара)
CREATE TABLE chefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    telegram_id BIGINT NOT NULL,
    telegram_chat_id BIGINT, -- Chat ID для получения уведомлений о заказах в боте
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, telegram_id)
);

-- Создаем индексы для chefs
CREATE INDEX idx_chefs_restaurant_id ON chefs(restaurant_id);
CREATE INDEX idx_chefs_telegram_id ON chefs(telegram_id);
CREATE INDEX idx_chefs_telegram_chat_id ON chefs(telegram_chat_id);
CREATE INDEX idx_chefs_is_active ON chefs(is_active);

-- Добавляем триггер для updated_at
CREATE TRIGGER update_chefs_updated_at BEFORE UPDATE ON chefs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Включаем RLS для chefs
ALTER TABLE chefs ENABLE ROW LEVEL SECURITY;

-- RLS политики для chefs (только через service role для записи)
-- Просмотр только через service role

-- Удаляем старые индексы restaurant_admins (если они еще существуют)
DROP INDEX IF EXISTS idx_restaurant_admins_restaurant_id;
DROP INDEX IF EXISTS idx_restaurant_admins_telegram_id;

-- Удаляем поле telegram_chat_id из restaurants (теперь оно в chefs)
-- Но оставляем для обратной совместимости, можно будет удалить позже
-- ALTER TABLE restaurants DROP COLUMN IF EXISTS telegram_chat_id;



