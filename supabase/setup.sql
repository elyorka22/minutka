-- ============================================
-- Minutka Database Setup - Complete Schema
-- Supabase PostgreSQL
-- Примените этот файл в Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    category VARCHAR(255),
    working_hours JSONB, -- {"monday": "09:00-22:00", "tuesday": "09:00-22:00", ...}
    telegram_chat_id BIGINT, -- Telegram chat ID (legacy, теперь используется в chefs)
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false, -- Для TOP ресторанов
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (Telegram users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT, -- Может быть NULL для пользователей без Telegram
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT users_telegram_id_unique UNIQUE NULLS NOT DISTINCT (telegram_id) -- Уникальность только для не-NULL значений
);

-- Chefs table (повара)
CREATE TABLE IF NOT EXISTS chefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    telegram_id BIGINT NOT NULL,
    telegram_chat_id BIGINT, -- Chat ID для получения уведомлений о заказах в боте
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    password VARCHAR(255), -- Пароль для входа
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, telegram_id)
);

-- Restaurant admins table (админы ресторанов - создаются поварами)
CREATE TABLE IF NOT EXISTS restaurant_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    telegram_id BIGINT NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(255), -- Телефон админа
    password VARCHAR(255), -- Пароль для входа
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, telegram_id)
);

-- Super admins table (супер-админы)
CREATE TABLE IF NOT EXISTS super_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    password VARCHAR(255), -- Пароль для входа
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_text TEXT NOT NULL, -- Свободная форма заказа
    address TEXT, -- Адрес доставки
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, ready, delivered, cancelled
    telegram_message_id INTEGER, -- ID сообщения в Telegram для повара
    archived_at TIMESTAMP WITH TIME ZONE, -- Дата архивации (устанавливается автоматически при статусе "delivered")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order status history table
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(50), -- 'user', 'chef', 'admin', 'system'
    telegram_id BIGINT, -- Кто изменил (если через Telegram)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Banners table (рекламные баннеры)
CREATE TABLE IF NOT EXISTS banners (
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
CREATE TABLE IF NOT EXISTS bot_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL, -- 'bot_info', 'partnership', 'button_bot_info_text', 'button_partnership_text'
    value TEXT NOT NULL, -- Текст сообщения или кнопки
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurant categories table (категории ресторанов)
CREATE TABLE IF NOT EXISTS restaurant_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL, -- Название категории
    image_url TEXT NOT NULL, -- URL изображения категории
    display_order INTEGER DEFAULT 0, -- Порядок отображения
    is_active BOOLEAN DEFAULT true, -- Активна ли категория
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu items table (блюда в меню ресторанов)
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(255), -- Категория блюда (может быть null)
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Restaurants indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_is_active ON restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_featured ON restaurants(is_featured);
CREATE INDEX IF NOT EXISTS idx_restaurants_telegram_chat_id ON restaurants(telegram_chat_id);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_archived_at ON orders(archived_at);

-- Chefs indexes
CREATE INDEX IF NOT EXISTS idx_chefs_restaurant_id ON chefs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_chefs_telegram_id ON chefs(telegram_id);
CREATE INDEX IF NOT EXISTS idx_chefs_telegram_chat_id ON chefs(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_chefs_is_active ON chefs(is_active);

-- Restaurant admins indexes
CREATE INDEX IF NOT EXISTS idx_restaurant_admins_restaurant_id ON restaurant_admins(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_admins_telegram_id ON restaurant_admins(telegram_id);

-- Super admins indexes
CREATE INDEX IF NOT EXISTS idx_super_admins_telegram_id ON super_admins(telegram_id);
CREATE INDEX IF NOT EXISTS idx_super_admins_is_active ON super_admins(is_active);

-- Order status history indexes
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at DESC);

-- Banners indexes
CREATE INDEX IF NOT EXISTS idx_banners_restaurant_id ON banners(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position);
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON banners(display_order);

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
DROP TRIGGER IF EXISTS update_restaurants_updated_at ON restaurants;
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_banners_updated_at ON banners;
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bot_settings_updated_at ON bot_settings;
CREATE TRIGGER update_bot_settings_updated_at BEFORE UPDATE ON bot_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_restaurant_categories_updated_at ON restaurant_categories;
CREATE TRIGGER update_restaurant_categories_updated_at BEFORE UPDATE ON restaurant_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chefs_updated_at ON chefs;
CREATE TRIGGER update_chefs_updated_at BEFORE UPDATE ON chefs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_restaurant_admins_updated_at ON restaurant_admins;
CREATE TRIGGER update_restaurant_admins_updated_at BEFORE UPDATE ON restaurant_admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_super_admins_updated_at ON super_admins;
CREATE TRIGGER update_super_admins_updated_at BEFORE UPDATE ON super_admins
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
DROP TRIGGER IF EXISTS log_order_status_change_trigger ON orders;
CREATE TRIGGER log_order_status_change_trigger
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION log_order_status_change();

-- Функция для автоматического архивирования доставленных заказов
CREATE OR REPLACE FUNCTION archive_delivered_orders()
RETURNS TRIGGER AS $$
BEGIN
    -- Если статус заказа изменился на "delivered", архивируем его
    IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
        NEW.archived_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматического архивирования
DROP TRIGGER IF EXISTS archive_delivered_orders_trigger ON orders;
CREATE TRIGGER archive_delivered_orders_trigger
    BEFORE UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION archive_delivered_orders();

-- Функция для автоматического удаления архивных заказов старше 20 дней
CREATE OR REPLACE FUNCTION delete_old_archived_orders()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Удаляем архивные заказы старше 20 дней
    DELETE FROM orders
    WHERE archived_at IS NOT NULL
    AND archived_at < NOW() - INTERVAL '20 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_categories ENABLE ROW LEVEL SECURITY;

-- Restaurants: публичный доступ на чтение активных ресторанов
DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;
CREATE POLICY "Public can view active restaurants"
    ON restaurants FOR SELECT
    USING (is_active = true);

-- Users: пользователи могут видеть только свои данные
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data"
    ON users FOR SELECT
    USING (true); -- В реальности нужно проверять через JWT или service role

-- Users: пользователи могут создавать свои записи
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data"
    ON users FOR INSERT
    WITH CHECK (true);

-- Orders: публичный доступ на создание заказов
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Anyone can create orders"
    ON orders FOR INSERT
    WITH CHECK (true);

-- Orders: пользователи могут видеть свои заказы
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (true); -- В реальности проверять user_id через JWT

-- Orders: рестораны могут обновлять свои заказы
DROP POLICY IF EXISTS "Restaurants can update own orders" ON orders;
CREATE POLICY "Restaurants can update own orders"
    ON orders FOR UPDATE
    USING (true); -- В реальности проверять restaurant_id через service role

-- Banners: публичный доступ на чтение активных баннеров
DROP POLICY IF EXISTS "Public can view active banners" ON banners;
CREATE POLICY "Public can view active banners"
    ON banners FOR SELECT
    USING (is_active = true);

-- Bot settings: публичный доступ на чтение
DROP POLICY IF EXISTS "Public can view bot settings" ON bot_settings;
CREATE POLICY "Public can view bot settings"
    ON bot_settings FOR SELECT
    USING (true);

-- Restaurant categories: публичный доступ на чтение активных категорий
DROP POLICY IF EXISTS "Public can view active categories" ON restaurant_categories;
CREATE POLICY "Public can view active categories"
    ON restaurant_categories FOR SELECT
    USING (is_active = true);

-- Menu items: публичный доступ на чтение доступных блюд
DROP POLICY IF EXISTS "Public can view available menu items" ON menu_items;
CREATE POLICY "Public can view available menu items"
    ON menu_items FOR SELECT
    USING (is_available = true);

-- ============================================
-- INITIAL DATA
-- ============================================

-- Initial bot settings
INSERT INTO bot_settings (key, value) VALUES
    ('bot_info', 'Online Bozor - Online do''kon platformasi. Biz bilan siz kerakli mahsulotlarni uyingizga buyurtma berishingiz mumkin.'),
    ('partnership', 'Hamkorlik uchun biz bilan bog''laning: @onlinebozor_admin yoki email: info@onlinebozor.uz'),
    ('button_bot_info_text', 'ℹ️ Bot haqida'),
    ('button_partnership_text', '🤝 Hamkorlik')
ON CONFLICT (key) DO NOTHING;

-- Note: Добавьте супер-админа вручную через Supabase SQL Editor:
-- INSERT INTO super_admins (telegram_id, username, first_name, last_name) VALUES
--     (YOUR_TELEGRAM_ID, 'your_username', 'Your', 'Name');

-- Создаем индексы для super_admins
CREATE INDEX IF NOT EXISTS idx_super_admins_telegram_id ON super_admins(telegram_id);
CREATE INDEX IF NOT EXISTS idx_super_admins_is_active ON super_admins(is_active);

-- Включаем RLS для super_admins
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Initial restaurant categories
INSERT INTO restaurant_categories (name, image_url, display_order) VALUES
    ('Italyan', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop', 1),
    ('Yapon', 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=400&fit=crop', 2),
    ('Burgerlar', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop', 3),
    ('Kavkaz', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop', 4),
    ('Kofe', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop', 5),
    ('Osiyo', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop', 6)
ON CONFLICT DO NOTHING;

-- ============================================
-- STORAGE SETUP
-- ============================================

-- Создаем bucket для изображений
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Политика для публичного чтения изображений
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- ============================================
-- COMPLETE!
-- ============================================
-- База данных настроена и готова к использованию
-- Все таблицы, индексы, триггеры и RLS политики созданы
-- Storage bucket для изображений создан
-- ============================================

