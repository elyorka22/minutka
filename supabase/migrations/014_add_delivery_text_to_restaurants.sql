-- ============================================
-- Migration: Add delivery_text to restaurants
-- ============================================

-- Добавляем колонку delivery_text для текста о доставке
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS delivery_text TEXT;

-- Устанавливаем значение по умолчанию для существующих записей
UPDATE restaurants 
SET delivery_text = 'Telegram-bot orqali buyurtma bering'
WHERE delivery_text IS NULL;

