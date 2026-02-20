-- ============================================
-- Migration: Add discount_percent to menu_items
-- Добавляем поле для процента скидки на товары
-- ============================================

ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT NULL;

-- Добавляем проверку, что скидка в диапазоне 0-100
ALTER TABLE menu_items
ADD CONSTRAINT check_discount_percent_range 
CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100));

-- Комментарий к полю
COMMENT ON COLUMN menu_items.discount_percent IS 'Процент скидки на товар (0-100). NULL означает отсутствие скидки';

