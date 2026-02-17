-- ============================================
-- Migration: Add store_carousels table
-- ============================================

-- Таблица каруселей для магазинов
CREATE TABLE IF NOT EXISTS store_carousels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, name) -- Одна карусель с таким именем может быть только один раз для магазина
);

-- Таблица связи товаров с каруселями
CREATE TABLE IF NOT EXISTS store_carousel_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carousel_id UUID NOT NULL REFERENCES store_carousels(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(carousel_id, menu_item_id) -- Один товар может быть только один раз в карусели
);

-- Индексы для store_carousels
CREATE INDEX IF NOT EXISTS idx_store_carousels_restaurant_id ON store_carousels(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_store_carousels_display_order ON store_carousels(display_order);
CREATE INDEX IF NOT EXISTS idx_store_carousels_is_active ON store_carousels(is_active);

-- Индексы для store_carousel_items
CREATE INDEX IF NOT EXISTS idx_store_carousel_items_carousel_id ON store_carousel_items(carousel_id);
CREATE INDEX IF NOT EXISTS idx_store_carousel_items_menu_item_id ON store_carousel_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_store_carousel_items_display_order ON store_carousel_items(display_order);

-- Триггер для updated_at
CREATE TRIGGER update_store_carousels_updated_at BEFORE UPDATE ON store_carousels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Включаем RLS
ALTER TABLE store_carousels ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_carousel_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies для store_carousels
-- Публичный доступ на чтение активных каруселей
DROP POLICY IF EXISTS "Public can view active store carousels" ON store_carousels;
CREATE POLICY "Public can view active store carousels"
    ON store_carousels FOR SELECT
    USING (is_active = true);

-- Супер-админы могут управлять всеми каруселями магазинов
DROP POLICY IF EXISTS "Super admins can manage all store carousels" ON store_carousels;
CREATE POLICY "Super admins can manage all store carousels"
    ON store_carousels FOR ALL
    USING ((current_setting('request.jwt.claims', true)::jsonb)->>'role' = 'super_admin')
    WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb)->>'role' = 'super_admin');

-- RLS Policies для store_carousel_items
-- Публичный доступ на чтение элементов каруселей
DROP POLICY IF EXISTS "Public can view store carousel items" ON store_carousel_items;
CREATE POLICY "Public can view store carousel items"
    ON store_carousel_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM store_carousels
            WHERE store_carousels.id = store_carousel_items.carousel_id
            AND store_carousels.is_active = true
        )
    );

-- Супер-админы могут управлять всеми элементами каруселей
DROP POLICY IF EXISTS "Super admins can manage all store carousel items" ON store_carousel_items;
CREATE POLICY "Super admins can manage all store carousel items"
    ON store_carousel_items FOR ALL
    USING ((current_setting('request.jwt.claims', true)::jsonb)->>'role' = 'super_admin')
    WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb)->>'role' = 'super_admin');

-- Комментарии к полям
COMMENT ON TABLE store_carousels IS 'Карусели для магазинов';
COMMENT ON COLUMN store_carousels.restaurant_id IS 'ID магазина, которому принадлежит карусель';
COMMENT ON COLUMN store_carousels.name IS 'Название карусели';
COMMENT ON COLUMN store_carousels.display_order IS 'Порядок отображения карусели (меньше = выше)';
COMMENT ON COLUMN store_carousels.is_active IS 'Активна ли карусель';

COMMENT ON TABLE store_carousel_items IS 'Связь товаров с каруселями магазинов';
COMMENT ON COLUMN store_carousel_items.carousel_id IS 'ID карусели';
COMMENT ON COLUMN store_carousel_items.menu_item_id IS 'ID товара';
COMMENT ON COLUMN store_carousel_items.display_order IS 'Порядок отображения товара в карусели';

