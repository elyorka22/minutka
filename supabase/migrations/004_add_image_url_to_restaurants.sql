-- ============================================
-- Migration: Add image_url column to restaurants
-- ============================================

-- Добавляем колонку image_url, если её нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'restaurants' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE restaurants ADD COLUMN image_url TEXT;
    END IF;
END $$;


