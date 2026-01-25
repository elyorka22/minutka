-- ============================================
-- Migration: Add order archiving functionality
-- ============================================

-- Добавляем поле archived_at в таблицу orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Создаем индекс для быстрого поиска архивных заказов
CREATE INDEX IF NOT EXISTS idx_orders_archived_at ON orders(archived_at);

-- Функция для автоматического архивирования доставленных заказов
CREATE OR REPLACE FUNCTION archive_delivered_orders()
RETURNS TRIGGER AS $$
BEGIN
    -- Если статус заказа изменился на "delivered", архивируем его
    IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
        NEW.archived_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматического архивирования
DROP TRIGGER IF EXISTS archive_delivered_orders_trigger ON orders;
CREATE TRIGGER archive_delivered_orders_trigger
    BEFORE UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION archive_delivered_orders();

-- Функция для автоматического удаления архивных заказов старше 20 дней
CREATE OR REPLACE FUNCTION delete_old_archived_orders()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Удаляем архивные заказы старше 20 дней
    DELETE FROM orders
    WHERE archived_at IS NOT NULL
    AND archived_at < NOW() - INTERVAL '20 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Комментарии для документации
COMMENT ON FUNCTION archive_delivered_orders() IS 'Автоматически архивирует заказы при изменении статуса на "delivered"';
COMMENT ON FUNCTION delete_old_archived_orders() IS 'Удаляет архивные заказы старше 20 дней';

