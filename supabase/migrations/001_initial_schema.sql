-- ============================================
-- Minutka Database Schema
-- Supabase PostgreSQL
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Restaurants table
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    working_hours JSONB, -- {"monday": "09:00-22:00", "tuesday": "09:00-22:00", ...}
    telegram_chat_id BIGINT, -- Telegram chat ID для отправки заказов
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false, -- Для TOP ресторанов
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (Telegram users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurant admins table
CREATE TABLE restaurant_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    telegram_id BIGINT NOT NULL,
    username VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, telegram_id)
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_text TEXT NOT NULL, -- Свободная форма заказа
    address TEXT, -- Адрес доставки
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, ready, delivered, cancelled
    telegram_message_id INTEGER, -- ID сообщения в Telegram для ресторана
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order status history table
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(50), -- 'user', 'restaurant', 'system'
    telegram_id BIGINT, -- Кто изменил (если через Telegram)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Banners table (рекламные баннеры)
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    title VARCHAR(255),
    image_url TEXT NOT NULL,
    link_url TEXT, -- Ссылка при клике
    position VARCHAR(50) DEFAULT 'homepage', -- homepage, restaurant_page, recommended
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0, -- Порядок отображения
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bot settings table (настройки бота)
CREATE TABLE bot_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL, -- 'bot_info', 'partnership'
    value TEXT NOT NULL, -- Текст сообщения
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurant categories table (категории ресторанов)
CREATE TABLE restaurant_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL, -- Название категории
    image_url TEXT NOT NULL, -- URL изображения категории
    display_order INTEGER DEFAULT 0, -- Порядок отображения
    is_active BOOLEAN DEFAULT true, -- Активна ли категория
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Restaurants indexes
CREATE INDEX idx_restaurants_is_active ON restaurants(is_active);
CREATE INDEX idx_restaurants_is_featured ON restaurants(is_featured);
CREATE INDEX idx_restaurants_telegram_chat_id ON restaurants(telegram_chat_id);

-- Users indexes
CREATE INDEX idx_users_telegram_id ON users(telegram_id);

-- Orders indexes
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Restaurant admins indexes
CREATE INDEX idx_restaurant_admins_restaurant_id ON restaurant_admins(restaurant_id);
CREATE INDEX idx_restaurant_admins_telegram_id ON restaurant_admins(telegram_id);

-- Order status history indexes
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_created_at ON order_status_history(created_at DESC);

-- Banners indexes
CREATE INDEX idx_banners_restaurant_id ON banners(restaurant_id);
CREATE INDEX idx_banners_position ON banners(position);
CREATE INDEX idx_banners_is_active ON banners(is_active);
CREATE INDEX idx_banners_display_order ON banners(display_order);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bot_settings_updated_at BEFORE UPDATE ON bot_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_categories_updated_at BEFORE UPDATE ON restaurant_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO order_status_history (order_id, status, changed_by, telegram_id)
        VALUES (NEW.id, NEW.status, 'system', NULL);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for order status history
CREATE TRIGGER log_order_status_change_trigger
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION log_order_status_change();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_categories ENABLE ROW LEVEL SECURITY;

-- Restaurants: публичный доступ на чтение активных ресторанов
CREATE POLICY "Public can view active restaurants"
    ON restaurants FOR SELECT
    USING (is_active = true);

-- Users: пользователи могут видеть только свои данные
CREATE POLICY "Users can view own data"
    ON users FOR SELECT
    USING (true); -- В реальности нужно проверять через JWT или service role

-- Users: пользователи могут создавать свои записи
CREATE POLICY "Users can insert own data"
    ON users FOR INSERT
    WITH CHECK (true);

-- Orders: публичный доступ на создание заказов
CREATE POLICY "Anyone can create orders"
    ON orders FOR INSERT
    WITH CHECK (true);

-- Orders: пользователи могут видеть свои заказы
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (true); -- В реальности проверять user_id через JWT

-- Orders: рестораны могут обновлять свои заказы
CREATE POLICY "Restaurants can update own orders"
    ON orders FOR UPDATE
    USING (true); -- В реальности проверять restaurant_id через service role

-- Banners: публичный доступ на чтение активных баннеров
CREATE POLICY "Public can view active banners"
    ON banners FOR SELECT
    USING (is_active = true);

-- Bot settings: публичный доступ на чтение
CREATE POLICY "Public can view bot settings"
    ON bot_settings FOR SELECT
    USING (true);

-- Restaurant categories: публичный доступ на чтение активных категорий
CREATE POLICY "Public can view active categories"
    ON restaurant_categories FOR SELECT
    USING (is_active = true);

-- Bot settings: только через service role для записи
-- (Обновление через service role key в backend)

-- Restaurant admins: только через service role
-- (RLS политики для админов лучше обрабатывать через service role key)

-- ============================================
-- INITIAL DATA (опционально)
-- ============================================

-- ============================================
-- INITIAL BOT SETTINGS
-- ============================================

-- Вставляем начальные настройки бота
INSERT INTO bot_settings (key, value) VALUES
    ('bot_info', 'Minutka - Telegram orqali ovqat yetkazib berish platformasi. Biz bilan siz sevimli taomlaringizni uyingizga buyurtma berishingiz mumkin.'),
    ('partnership', 'Hamkorlik uchun biz bilan bog''laning: @minutka_admin yoki email: info@minutka.uz'),
    ('button_bot_info_text', 'ℹ️ Bot haqida'),
    ('button_partnership_text', '🤝 Hamkorlik')
ON CONFLICT (key) DO NOTHING;

-- Вставляем начальные категории ресторанов
INSERT INTO restaurant_categories (id, name, image_url, display_order) VALUES
    (gen_random_uuid(), 'Italyan', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop', 1),
    (gen_random_uuid(), 'Yapon', 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=400&fit=crop', 2),
    (gen_random_uuid(), 'Burgerlar', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop', 3),
    (gen_random_uuid(), 'Kavkaz', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop', 4),
    (gen_random_uuid(), 'Kofe', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop', 5),
    (gen_random_uuid(), 'Osiyo', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop', 6)
ON CONFLICT DO NOTHING;

