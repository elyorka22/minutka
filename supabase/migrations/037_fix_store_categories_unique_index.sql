-- ============================================
-- Migration: Fix unique constraint for store_categories to allow null restaurant_id
-- Исправляем уникальный constraint, чтобы разрешить создание категорий главной страницы
-- ============================================

-- Удаляем старый уникальный constraint (PostgreSQL создает constraint, а не просто индекс)
-- Пробуем разные возможные имена constraint
DO $$
BEGIN
    -- Пытаемся удалить constraint с разными возможными именами
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'store_categories'::regclass 
        AND contype = 'u'
        AND array_to_string(conkey, ',') = (
            SELECT array_to_string(array_agg(attnum), ',')
            FROM pg_attribute
            WHERE attrelid = 'store_categories'::regclass
            AND attname IN ('restaurant_id', 'name')
            ORDER BY attnum
        )
    ) THEN
        -- Находим имя constraint и удаляем его
        EXECUTE (
            SELECT 'ALTER TABLE store_categories DROP CONSTRAINT ' || conname
            FROM pg_constraint
            WHERE conrelid = 'store_categories'::regclass
            AND contype = 'u'
            AND array_to_string(conkey, ',') = (
                SELECT array_to_string(array_agg(attnum), ',')
                FROM pg_attribute
                WHERE attrelid = 'store_categories'::regclass
                AND attname IN ('restaurant_id', 'name')
                ORDER BY attnum
            )
            LIMIT 1
        );
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

