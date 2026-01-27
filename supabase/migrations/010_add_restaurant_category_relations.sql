-- ============================================
-- Restaurant-Category Relations Table
-- ============================================

-- Таблица для связи many-to-many между ресторанами и категориями
CREATE TABLE IF NOT EXISTS restaurant_category_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES restaurant_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, category_id) -- Один ресторан может быть привязан к категории только один раз
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_restaurant_category_relations_restaurant_id ON restaurant_category_relations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_category_relations_category_id ON restaurant_category_relations(category_id);

-- RLS политики
ALTER TABLE restaurant_category_relations ENABLE ROW LEVEL SECURITY;

-- Публичный доступ на чтение
DROP POLICY IF EXISTS "Public can view restaurant category relations" ON restaurant_category_relations;
CREATE POLICY "Public can view restaurant category relations"
    ON restaurant_category_relations FOR SELECT
    USING (true);

-- Только супер-админы могут управлять связями
DROP POLICY IF EXISTS "Super admins can manage restaurant category relations" ON restaurant_category_relations;
CREATE POLICY "Super admins can manage restaurant category relations"
    ON restaurant_category_relations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE super_admins.telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id'
            AND super_admins.is_active = true
        )
    );

