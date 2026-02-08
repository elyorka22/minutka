-- Таблица для хранения созданных сообщений с кнопками меню для ресторанов
CREATE TABLE IF NOT EXISTS restaurant_menu_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  message_text TEXT NOT NULL,
  button_text VARCHAR(100) NOT NULL DEFAULT 'Меню',
  menu_url TEXT NOT NULL,
  telegram_message_id BIGINT, -- ID сообщения в Telegram (если было отправлено)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (restaurant_id) -- Одно сообщение на ресторан
);

CREATE INDEX IF NOT EXISTS idx_restaurant_menu_messages_restaurant_id ON restaurant_menu_messages(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_menu_messages_created_at ON restaurant_menu_messages(created_at);

-- RLS для restaurant_menu_messages
ALTER TABLE restaurant_menu_messages ENABLE ROW LEVEL SECURITY;

-- Policy для всех пользователей (для бота)
DROP POLICY IF EXISTS "Allow all users to read menu messages" ON restaurant_menu_messages;
CREATE POLICY "Allow all users to read menu messages"
ON restaurant_menu_messages FOR SELECT
USING (true);

-- Policy для super_admins и restaurant_admins для создания/обновления
DROP POLICY IF EXISTS "Super admins and restaurant admins can manage menu messages" ON restaurant_menu_messages;
CREATE POLICY "Super admins and restaurant admins can manage menu messages"
ON restaurant_menu_messages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM super_admins 
    WHERE super_admins.telegram_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM restaurant_admins
    WHERE restaurant_admins.telegram_id = auth.uid()
    AND restaurant_admins.restaurant_id = restaurant_menu_messages.restaurant_id
    AND restaurant_admins.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM super_admins 
    WHERE super_admins.telegram_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM restaurant_admins
    WHERE restaurant_admins.telegram_id = auth.uid()
    AND restaurant_admins.restaurant_id = restaurant_menu_messages.restaurant_id
    AND restaurant_admins.is_active = true
  )
);

COMMENT ON TABLE restaurant_menu_messages IS 'Сохраненные сообщения с кнопками меню для ресторанов';
COMMENT ON COLUMN restaurant_menu_messages.restaurant_id IS 'ID ресторана';
COMMENT ON COLUMN restaurant_menu_messages.message_text IS 'Текст сообщения';
COMMENT ON COLUMN restaurant_menu_messages.button_text IS 'Текст кнопки';
COMMENT ON COLUMN restaurant_menu_messages.menu_url IS 'URL меню ресторана';
COMMENT ON COLUMN restaurant_menu_messages.telegram_message_id IS 'ID сообщения в Telegram (если было отправлено)';

