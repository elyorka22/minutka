-- ============================================
-- Migration: Add tab field to banners table
-- Баннеры для разных вкладок главной страницы
-- ============================================

-- Добавляем поле tab для указания вкладки
ALTER TABLE banners
ADD COLUMN IF NOT EXISTS tab VARCHAR(50) DEFAULT 'asosiy';

-- Добавляем индекс для быстрого поиска баннеров по вкладке
CREATE INDEX IF NOT EXISTS idx_banners_tab ON banners(tab);

-- Обновляем существующие баннеры: если position = 'homepage', то tab = 'asosiy'
UPDATE banners
SET tab = 'asosiy'
WHERE tab IS NULL OR tab = '';

-- Комментарий к полю
COMMENT ON COLUMN banners.tab IS 'Вкладка главной страницы: asosiy, do\'konlar, xizmatlar';

