-- ============================================
-- Migration: Add display_type to store_categories
-- Тип отображения категории: grid (2 колонки) или carousel (карусель)
-- ============================================

-- Добавляем поле display_type
ALTER TABLE store_categories
ADD COLUMN IF NOT EXISTS display_type VARCHAR(20) DEFAULT 'grid' CHECK (display_type IN ('grid', 'carousel'));

-- Обновляем существующие категории: по умолчанию grid
UPDATE store_categories
SET display_type = 'grid'
WHERE display_type IS NULL;

-- Добавляем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_store_categories_display_type ON store_categories(display_type);

-- Комментарий к полю
COMMENT ON COLUMN store_categories.display_type IS 'Тип отображения категории: grid (2 колонки) или carousel (карусель)';

