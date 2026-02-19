-- ============================================
-- Migration: Add discount_percent to menu_items
-- ============================================

-- Добавляем поле для процента скидки к товарам
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT NULL CHECK (discount_percent IS NULL OR (discount_percent >= 1 AND discount_percent <= 100));

-- Индекс для быстрого поиска товаров со скидкой
CREATE INDEX IF NOT EXISTS idx_menu_items_discount_percent ON menu_items(discount_percent) WHERE discount_percent IS NOT NULL;

-- Комментарий к полю
COMMENT ON COLUMN menu_items.discount_percent IS 'Процент скидки на товар (от 1 до 100). NULL означает отсутствие скидки';

