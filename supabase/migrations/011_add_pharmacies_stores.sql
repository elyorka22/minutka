-- ============================================
-- Pharmacies/Stores Table
-- ============================================

-- Таблица для аптек и магазинов
CREATE TABLE IF NOT EXISTS pharmacies_stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    phone VARCHAR(20) NOT NULL,
    working_hours JSONB, -- {"monday": "09:00-22:00", "tuesday": "09:00-22:00", ...}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_pharmacies_stores_is_active ON pharmacies_stores(is_active);
CREATE INDEX IF NOT EXISTS idx_pharmacies_stores_created_at ON pharmacies_stores(created_at DESC);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_pharmacies_stores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_pharmacies_stores_updated_at ON pharmacies_stores;
CREATE TRIGGER update_pharmacies_stores_updated_at
    BEFORE UPDATE ON pharmacies_stores
    FOR EACH ROW
    EXECUTE FUNCTION update_pharmacies_stores_updated_at();

-- RLS политики
ALTER TABLE pharmacies_stores ENABLE ROW LEVEL SECURITY;

-- Публичный доступ на чтение активных аптек/магазинов
DROP POLICY IF EXISTS "Public can view active pharmacies stores" ON pharmacies_stores;
CREATE POLICY "Public can view active pharmacies stores"
    ON pharmacies_stores FOR SELECT
    USING (is_active = true);

-- Только супер-админы могут управлять аптеками/магазинами
DROP POLICY IF EXISTS "Super admins can manage pharmacies stores" ON pharmacies_stores;
CREATE POLICY "Super admins can manage pharmacies stores"
    ON pharmacies_stores FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE super_admins.telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id'
            AND super_admins.is_active = true
        )
    );

