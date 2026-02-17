-- ============================================
-- Migration: Add promotions (sales) system
-- ============================================

-- Таблица для акций
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для promotions
CREATE INDEX IF NOT EXISTS idx_promotions_display_order ON promotions(display_order);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_start_date ON promotions(start_date);
CREATE INDEX IF NOT EXISTS idx_promotions_end_date ON promotions(end_date);

-- Триггер для updated_at
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Включаем RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies для promotions
-- Публичный доступ на чтение активных акций
DROP POLICY IF EXISTS "Public can view active promotions" ON promotions;
CREATE POLICY "Public can view active promotions"
    ON promotions FOR SELECT
    USING (is_active = true);

-- Супер-админы могут управлять всеми акциями
DROP POLICY IF EXISTS "Super admins can manage all promotions" ON promotions;
CREATE POLICY "Super admins can manage all promotions"
    ON promotions FOR ALL
    USING ((current_setting('request.jwt.claims', true)::jsonb)->>'role' = 'super_admin')
    WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb)->>'role' = 'super_admin');

-- Таблица для связи товаров с акциями
CREATE TABLE IF NOT EXISTS promotion_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(promotion_id, menu_item_id) -- Один товар может быть только один раз в одной акции
);

-- Индексы для promotion_items
CREATE INDEX IF NOT EXISTS idx_promotion_items_promotion_id ON promotion_items(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_items_menu_item_id ON promotion_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_promotion_items_display_order ON promotion_items(display_order);

-- Включаем RLS
ALTER TABLE promotion_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies для promotion_items
-- Публичный доступ на чтение товаров в активных акциях
DROP POLICY IF EXISTS "Public can view active promotion items" ON promotion_items;
CREATE POLICY "Public can view active promotion items"
    ON promotion_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM promotions
            WHERE promotions.id = promotion_items.promotion_id
            AND promotions.is_active = true
        )
    );

-- Супер-админы могут управлять всеми товарами в акциях
DROP POLICY IF EXISTS "Super admins can manage all promotion items" ON promotion_items;
CREATE POLICY "Super admins can manage all promotion items"
    ON promotion_items FOR ALL
    USING ((current_setting('request.jwt.claims', true)::jsonb)->>'role' = 'super_admin')
    WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb)->>'role' = 'super_admin');

-- Комментарии к полям
COMMENT ON TABLE promotions IS 'Акции и скидки';
COMMENT ON COLUMN promotions.name IS 'Название акции';
COMMENT ON COLUMN promotions.description IS 'Описание акции (опционально)';
COMMENT ON COLUMN promotions.image_url IS 'URL изображения акции (опционально)';
COMMENT ON COLUMN promotions.discount_percent IS 'Процент скидки (от 1 до 100)';
COMMENT ON COLUMN promotions.display_order IS 'Порядок отображения акции (меньше = выше)';
COMMENT ON COLUMN promotions.is_active IS 'Активна ли акция';
COMMENT ON COLUMN promotions.start_date IS 'Дата начала акции (опционально)';
COMMENT ON COLUMN promotions.end_date IS 'Дата окончания акции (опционально)';

COMMENT ON TABLE promotion_items IS 'Связь товаров с акциями';
COMMENT ON COLUMN promotion_items.promotion_id IS 'ID акции';
COMMENT ON COLUMN promotion_items.menu_item_id IS 'ID товара';
COMMENT ON COLUMN promotion_items.display_order IS 'Порядок отображения товара в акции';

