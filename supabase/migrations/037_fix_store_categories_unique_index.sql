-- ============================================
-- Migration: Fix unique constraint for store_categories to allow null restaurant_id
-- Исправляем уникальный constraint, чтобы разрешить создание категорий главной страницы
-- ============================================

-- Удаляем старый уникальный constraint (PostgreSQL создает constraint, а не просто индекс)
-- Пробуем стандартные имена, которые PostgreSQL может создать
ALTER TABLE store_categories DROP CONSTRAINT IF EXISTS store_categories_restaurant_id_name_key;
ALTER TABLE store_categories DROP CONSTRAINT IF EXISTS store_categories_restaurant_id_name_idx;
ALTER TABLE store_categories DROP CONSTRAINT IF EXISTS store_categories_restaurant_id_name_ukey;

-- Также пытаемся найти и удалить constraint по колонкам
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Находим constraint по колонкам restaurant_id и name
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'store_categories'::regclass
    AND contype = 'u'
    AND (
        SELECT COUNT(*) = 2
        FROM unnest(conkey) AS col_idx
        JOIN pg_attribute ON pg_attribute.attrelid = conrelid AND pg_attribute.attnum = col_idx
        WHERE pg_attribute.attname IN ('restaurant_id', 'name')
    );
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE store_categories DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;
END $$;

-- Создаем новый уникальный индекс с частичным условием
-- Для категорий с restaurant_id != NULL: уникальность по (restaurant_id, name)
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

