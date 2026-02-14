-- ============================================
-- Migration: Add store_categories table
-- ============================================

-- Таблица категорий для магазинов
CREATE TABLE IF NOT EXISTS store_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, name) -- Одна категория с таким именем может быть только один раз для магазина
);

-- Индексы для store_categories
CREATE INDEX IF NOT EXISTS idx_store_categories_restaurant_id ON store_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_store_categories_display_order ON store_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_store_categories_is_active ON store_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_store_categories_created_at ON store_categories(created_at DESC);

-- Триггер для updated_at
CREATE TRIGGER update_store_categories_updated_at BEFORE UPDATE ON store_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Включаем RLS
ALTER TABLE store_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies для store_categories
-- Публичный доступ на чтение активных категорий
DROP POLICY IF EXISTS "Public can view active store categories" ON store_categories;
CREATE POLICY "Public can view active store categories"
    ON store_categories FOR SELECT
    USING (is_active = true);

-- Админы ресторанов могут управлять категориями своих магазинов
DROP POLICY IF EXISTS "Restaurant admins can manage their store categories" ON store_categories;
CREATE POLICY "Restaurant admins can manage their store categories"
    ON store_categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM restaurant_admins
            WHERE restaurant_admins.restaurant_id = store_categories.restaurant_id
            AND restaurant_admins.telegram_id::text = (current_setting('request.jwt.claims', true)::jsonb)->>'telegram_id'
            AND restaurant_admins.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM restaurant_admins
            WHERE restaurant_admins.restaurant_id = store_categories.restaurant_id
            AND restaurant_admins.telegram_id::text = (current_setting('request.jwt.claims', true)::jsonb)->>'telegram_id'
            AND restaurant_admins.is_active = true
        )
    );

-- Супер-админы могут управлять всеми категориями магазинов
DROP POLICY IF EXISTS "Super admins can manage all store categories" ON store_categories;
CREATE POLICY "Super admins can manage all store categories"
    ON store_categories FOR ALL
    USING ((current_setting('request.jwt.claims', true)::jsonb)->>'role' = 'super_admin')
    WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb)->>'role' = 'super_admin');

-- Комментарии к полям
COMMENT ON TABLE store_categories IS 'Категории для магазинов';
COMMENT ON COLUMN store_categories.restaurant_id IS 'ID магазина, которому принадлежит категория';
COMMENT ON COLUMN store_categories.name IS 'Название категории';
COMMENT ON COLUMN store_categories.description IS 'Описание категории (опционально)';
COMMENT ON COLUMN store_categories.image_url IS 'URL изображения категории (опционально)';
COMMENT ON COLUMN store_categories.display_order IS 'Порядок отображения категории (меньше = выше)';
COMMENT ON COLUMN store_categories.is_active IS 'Активна ли категория';

