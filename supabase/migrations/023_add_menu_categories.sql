-- ============================================
-- Migration: Add menu_categories table
-- ============================================

-- Таблица категорий меню для ресторанов
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, name) -- Одна категория с таким именем может быть только один раз для ресторана
);

-- Индексы для menu_categories
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant_id ON menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_display_order ON menu_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_menu_categories_is_active ON menu_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_categories_created_at ON menu_categories(created_at DESC);

-- Триггер для updated_at
CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON menu_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Включаем RLS
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies для menu_categories
-- Публичный доступ на чтение активных категорий
DROP POLICY IF EXISTS "Public can view active menu categories" ON menu_categories;
CREATE POLICY "Public can view active menu categories"
    ON menu_categories FOR SELECT
    USING (is_active = true);

-- Комментарии к полям
COMMENT ON TABLE menu_categories IS 'Категории меню для ресторанов';
COMMENT ON COLUMN menu_categories.restaurant_id IS 'ID ресторана, которому принадлежит категория';
COMMENT ON COLUMN menu_categories.name IS 'Название категории';
COMMENT ON COLUMN menu_categories.description IS 'Описание категории (опционально)';
COMMENT ON COLUMN menu_categories.image_url IS 'URL изображения категории (опционально)';
COMMENT ON COLUMN menu_categories.display_order IS 'Порядок отображения категории (меньше = выше)';
COMMENT ON COLUMN menu_categories.is_active IS 'Активна ли категория';

