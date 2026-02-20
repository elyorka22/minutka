-- ============================================
-- Migration: Add main page items support
-- Товары для главной страницы, управляемые супер-админом
-- ============================================

-- Делаем restaurant_id nullable для товаров главной страницы
ALTER TABLE menu_items
ALTER COLUMN restaurant_id DROP NOT NULL;

-- Добавляем поле is_main_page для обозначения товаров главной страницы
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS is_main_page BOOLEAN DEFAULT false;

-- Добавляем индекс для быстрого поиска товаров главной страницы
CREATE INDEX IF NOT EXISTS idx_menu_items_is_main_page ON menu_items(is_main_page) WHERE is_main_page = true;

-- Добавляем проверку: если is_main_page = true, то restaurant_id должен быть NULL
ALTER TABLE menu_items
ADD CONSTRAINT check_main_page_restaurant_id 
CHECK (
  (is_main_page = false) OR 
  (is_main_page = true AND restaurant_id IS NULL)
);

-- Комментарий к полю
COMMENT ON COLUMN menu_items.is_main_page IS 'Помечает товар как товар главной страницы. Такие товары управляются только супер-админом и не привязаны к конкретному магазину';

-- Обновляем RLS политику для чтения товаров главной страницы
DROP POLICY IF EXISTS "Public can view available menu items" ON menu_items;
CREATE POLICY "Public can view available menu items"
    ON menu_items FOR SELECT
    USING (is_available = true);

