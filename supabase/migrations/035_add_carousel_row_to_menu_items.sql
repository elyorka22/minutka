-- ============================================
-- Migration: Add carousel_row to menu_items
-- Номер ряда в карусели для товаров категории с display_type = 'carousel'
-- ============================================

-- Добавляем поле carousel_row
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS carousel_row INTEGER DEFAULT NULL;

-- Добавляем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_menu_items_carousel_row ON menu_items(carousel_row);

-- Комментарий к полю
COMMENT ON COLUMN menu_items.carousel_row IS 'Номер ряда в карусели (для категорий с display_type = carousel). Товары с одинаковым номером отображаются в одном ряду.';

