-- ============================================
-- Supabase Storage Setup
-- Настройка Storage для загрузки изображений
-- ============================================

-- Создаем bucket для изображений
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Политика для публичного чтения изображений
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Политика для загрузки изображений (только через service role)
-- В реальности загрузка происходит через backend API с service role key
-- Эта политика позволяет загружать через API

-- Политика для удаления изображений (только через service role)
-- Удаление происходит через backend API

-- ============================================
-- Примечание:
-- Загрузка изображений происходит через backend API
-- Backend использует service role key для загрузки в Storage
-- Пользователи не загружают напрямую в Storage
-- ============================================

