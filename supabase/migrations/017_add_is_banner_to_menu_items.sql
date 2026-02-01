-- ============================================
-- Migration: Add is_banner field to menu_items table
-- Allows marking menu items as large banner items for featured dishes
-- ============================================

-- Добавляем поле is_banner для пометки блюд как баннеров
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS is_banner BOOLEAN DEFAULT false;

-- Добавляем индекс для быстрого поиска баннеров
CREATE INDEX IF NOT EXISTS idx_menu_items_is_banner ON menu_items(is_banner) WHERE is_banner = true;

-- Комментарий к полю
COMMENT ON COLUMN menu_items.is_banner IS 'Помечает блюдо как баннер для отображения в большом формате (для ассорти, корпоративных предложений и т.д.)';

