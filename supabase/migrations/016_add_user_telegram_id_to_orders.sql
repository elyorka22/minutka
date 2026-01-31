-- ============================================
-- Migration: Add user_telegram_id to orders table
-- Allows orders without user_id, telegram_id used only for notifications
-- ============================================

-- Добавляем поле user_telegram_id для хранения Telegram ID для уведомлений
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS user_telegram_id BIGINT;

-- Делаем user_id опциональным (nullable)
ALTER TABLE orders 
ALTER COLUMN user_id DROP NOT NULL;

-- Добавляем индекс для быстрого поиска по user_telegram_id
CREATE INDEX IF NOT EXISTS idx_orders_user_telegram_id ON orders(user_telegram_id);

-- Комментарий к полю
COMMENT ON COLUMN orders.user_telegram_id IS 'Telegram ID пользователя для отправки уведомлений о статусе заказа. Может быть указан без создания записи в таблице users.';

