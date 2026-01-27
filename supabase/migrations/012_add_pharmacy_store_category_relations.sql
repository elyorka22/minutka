-- ============================================
-- Pharmacy/Store-Category Relations Table
-- ============================================

-- Таблица для связи many-to-many между аптеками/магазинами и категориями
CREATE TABLE IF NOT EXISTS pharmacy_store_category_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_store_id UUID NOT NULL REFERENCES pharmacies_stores(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES restaurant_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(pharmacy_store_id, category_id) -- Одна аптека/магазин может быть привязан к категории только один раз
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_pharmacy_store_category_relations_pharmacy_store_id ON pharmacy_store_category_relations(pharmacy_store_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_store_category_relations_category_id ON pharmacy_store_category_relations(category_id);

-- RLS политики
ALTER TABLE pharmacy_store_category_relations ENABLE ROW LEVEL SECURITY;

-- Публичный доступ на чтение
DROP POLICY IF EXISTS "Public can view pharmacy store category relations" ON pharmacy_store_category_relations;
CREATE POLICY "Public can view pharmacy store category relations"
    ON pharmacy_store_category_relations FOR SELECT
    USING (true);

-- Только супер-админы могут управлять связями
DROP POLICY IF EXISTS "Super admins can manage pharmacy store category relations" ON pharmacy_store_category_relations;
CREATE POLICY "Super admins can manage pharmacy store category relations"
    ON pharmacy_store_category_relations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE super_admins.telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id'
            AND super_admins.is_active = true
        )
    );

