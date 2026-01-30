-- ============================================
-- Migration: Add Couriers Table
-- ============================================

-- Создаем таблицу couriers (курьеры)
CREATE TABLE couriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    telegram_chat_id BIGINT, -- Chat ID для получения уведомлений о заказах в боте
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индексы для couriers
CREATE INDEX idx_couriers_telegram_id ON couriers(telegram_id);
CREATE INDEX idx_couriers_telegram_chat_id ON couriers(telegram_chat_id);
CREATE INDEX idx_couriers_is_active ON couriers(is_active);

-- Добавляем триггер для updated_at
CREATE TRIGGER update_couriers_updated_at BEFORE UPDATE ON couriers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Включаем RLS для couriers
ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;

-- RLS политики для couriers (публичный доступ для чтения, только service role для записи)
-- Просмотр только через service role

-- Добавляем поле courier_id в таблицу orders для отслеживания назначенного курьера
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_id UUID REFERENCES couriers(id) ON DELETE SET NULL;
CREATE INDEX idx_orders_courier_id ON orders(courier_id);

-- Добавляем новый статус для заказов: assigned_to_courier (передан курьеру)
-- Но сначала проверим, можно ли использовать существующий статус или нужно добавить новый
-- В текущей схеме статус VARCHAR(50), так что можно использовать существующий формат

