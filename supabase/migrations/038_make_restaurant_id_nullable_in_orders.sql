-- ============================================
-- Migration: Make restaurant_id nullable in orders table
-- Разрешаем создание заказов для товаров главной страницы (без привязки к ресторану)
-- ============================================

-- Убираем ограничение NOT NULL с restaurant_id
-- Это позволит создавать заказы для товаров главной страницы (restaurant_id = NULL)
ALTER TABLE orders 
ALTER COLUMN restaurant_id DROP NOT NULL;

-- Обновляем внешний ключ, чтобы он работал только для не-NULL значений
-- В PostgreSQL FK автоматически игнорирует NULL значения, но лучше явно указать это
-- Сначала удаляем старый FK
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_restaurant_id_fkey;

-- Создаем новый FK с явным указанием, что NULL значения разрешены
ALTER TABLE orders 
ADD CONSTRAINT orders_restaurant_id_fkey 
FOREIGN KEY (restaurant_id) 
REFERENCES restaurants(id) 
ON DELETE CASCADE;

-- Комментарий к колонке
COMMENT ON COLUMN orders.restaurant_id IS 'ID ресторана, к которому относится заказ. NULL для заказов товаров главной страницы (не привязанных к конкретному ресторану).';

