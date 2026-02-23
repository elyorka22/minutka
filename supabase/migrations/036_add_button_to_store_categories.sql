-- ============================================
-- Migration: Add button text and link to store_categories
-- Кнопка под категориями с текстом и ссылкой на Telegram
-- ============================================

-- Добавляем поля для кнопки
ALTER TABLE store_categories
ADD COLUMN IF NOT EXISTS button_text VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS button_link TEXT DEFAULT NULL;

-- Комментарии к полям
COMMENT ON COLUMN store_categories.button_text IS 'Текст кнопки под категориями (отображается на клиентской части)';
COMMENT ON COLUMN store_categories.button_link IS 'Ссылка для кнопки (обычно на Telegram, не отображается на клиентской части)';

