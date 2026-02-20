-- ============================================
-- Migration: Add menu_item_category_relations table
-- Связь many-to-many между товарами и категориями магазинов
-- ============================================

-- Таблица связей между товарами и категориями магазинов
CREATE TABLE IF NOT EXISTS menu_item_category_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    category_name VARCHAR(255) NOT NULL, -- Название категории из store_categories
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(menu_item_id, category_name) -- Один товар может быть привязан к категории только один раз
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_menu_item_category_relations_menu_item_id ON menu_item_category_relations(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_category_relations_category_name ON menu_item_category_relations(category_name);

-- Включаем RLS
ALTER TABLE menu_item_category_relations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Публичный доступ на чтение
DROP POLICY IF EXISTS "Public can view menu item category relations" ON menu_item_category_relations;
CREATE POLICY "Public can view menu item category relations"
    ON menu_item_category_relations FOR SELECT
    USING (true);

-- Супер-админы могут управлять всеми связями
DROP POLICY IF EXISTS "Super admins can manage all menu item category relations" ON menu_item_category_relations;
CREATE POLICY "Super admins can manage all menu item category relations"
    ON menu_item_category_relations FOR ALL
    USING ((current_setting('request.jwt.claims', true)::jsonb)->>'role' = 'super_admin')
    WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb)->>'role' = 'super_admin');

-- Админы ресторанов могут управлять связями только для своих товаров
DROP POLICY IF EXISTS "Restaurant admins can manage their menu item category relations" ON menu_item_category_relations;
CREATE POLICY "Restaurant admins can manage their menu item category relations"
    ON menu_item_category_relations FOR ALL
    USING (
        (current_setting('request.jwt.claims', true)::jsonb)->>'role' = 'restaurant_admin' AND
        menu_item_id IN (
            SELECT id FROM menu_items 
            WHERE restaurant_id IN (
                SELECT restaurant_id FROM restaurant_admins 
                WHERE telegram_id = (current_setting('request.jwt.claims', true)::jsonb)->>'telegram_id'
            )
        )
    )
    WITH CHECK (
        (current_setting('request.jwt.claims', true)::jsonb)->>'role' = 'restaurant_admin' AND
        menu_item_id IN (
            SELECT id FROM menu_items 
            WHERE restaurant_id IN (
                SELECT restaurant_id FROM restaurant_admins 
                WHERE telegram_id = (current_setting('request.jwt.claims', true)::jsonb)->>'telegram_id'
            )
        )
    );

-- Комментарии
COMMENT ON TABLE menu_item_category_relations IS 'Связь many-to-many между товарами и категориями магазинов';
COMMENT ON COLUMN menu_item_category_relations.menu_item_id IS 'ID товара';
COMMENT ON COLUMN menu_item_category_relations.category_name IS 'Название категории из store_categories';

