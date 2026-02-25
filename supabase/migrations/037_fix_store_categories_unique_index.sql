-- ============================================
-- Migration: Fix unique index for store_categories to allow null restaurant_id
-- Исправляем уникальный индекс, чтобы разрешить создание категорий главной страницы
-- ============================================

-- Удаляем старый уникальный индекс
DROP INDEX IF EXISTS store_categories_restaurant_id_name_key;

-- Создаем новый уникальный индекс с частичным условием
-- Для категорий с restaurant_id != NULL: уникальность по (restaurant_id, name)
-- Для категорий с restaurant_id = NULL: уникальность только по name
CREATE UNIQUE INDEX store_categories_restaurant_id_name_key 
ON store_categories (restaurant_id, name) 
WHERE restaurant_id IS NOT NULL;

-- Для категорий главной страницы (restaurant_id = NULL) создаем отдельный уникальный индекс по name
CREATE UNIQUE INDEX store_categories_main_page_name_key 
ON store_categories (name) 
WHERE restaurant_id IS NULL;

-- Комментарий
COMMENT ON INDEX store_categories_restaurant_id_name_key IS 'Уникальность по (restaurant_id, name) для категорий магазинов';
COMMENT ON INDEX store_categories_main_page_name_key IS 'Уникальность по name для категорий главной страницы (restaurant_id = NULL)';

