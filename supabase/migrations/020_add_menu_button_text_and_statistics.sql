-- ============================================
-- Add Menu Button Text and Statistics
-- ============================================

-- Добавляем поле для текста кнопки меню в таблицу restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS menu_button_text VARCHAR(100) DEFAULT 'Меню';

-- Комментарий к полю
COMMENT ON COLUMN restaurants.menu_button_text IS 'Текст кнопки меню для Telegram (по умолчанию "Меню")';

-- Создаем таблицу для статистики переходов на меню
CREATE TABLE IF NOT EXISTS menu_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    referer TEXT,
    ip_address INET,
    telegram_user_id BIGINT, -- ID пользователя Telegram, если открыто через Telegram
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_menu_views_restaurant_id ON menu_views(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_views_viewed_at ON menu_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_menu_views_telegram_user_id ON menu_views(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_menu_views_restaurant_viewed_at ON menu_views(restaurant_id, viewed_at DESC);

-- RLS политики
ALTER TABLE menu_views ENABLE ROW LEVEL SECURITY;

-- Публичный доступ на запись (для отслеживания просмотров)
DROP POLICY IF EXISTS "Public can insert menu views" ON menu_views;
CREATE POLICY "Public can insert menu views"
    ON menu_views FOR INSERT
    WITH CHECK (true);

-- Админы ресторанов могут просматривать статистику своего ресторана
DROP POLICY IF EXISTS "Restaurant admins can view their menu statistics" ON menu_views;
CREATE POLICY "Restaurant admins can view their menu statistics"
    ON menu_views FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM restaurant_admins
            WHERE restaurant_admins.restaurant_id = menu_views.restaurant_id
            AND restaurant_admins.telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id'
            AND restaurant_admins.is_active = true
        )
    );

-- Супер-админы могут просматривать всю статистику
DROP POLICY IF EXISTS "Super admins can view all menu statistics" ON menu_views;
CREATE POLICY "Super admins can view all menu statistics"
    ON menu_views FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM super_admins
            WHERE super_admins.telegram_id::text = current_setting('request.jwt.claims', true)::json->>'telegram_id'
            AND super_admins.is_active = true
        )
    );

