# Как добавить супер-админа в Supabase

## Шаг 1: Получите ваш Telegram ID

1. Откройте Telegram бота Minutka
2. Нажмите кнопку "🆔 Chat ID" в главном меню
3. Скопируйте ваш **Chat ID** (это число, например: `123456789`)

## Шаг 2: Добавьте супер-админа через Supabase SQL Editor

1. Откройте ваш проект в [Supabase Dashboard](https://app.supabase.com)
2. Перейдите в раздел **SQL Editor** (в левом меню)
3. Создайте новый запрос
4. Выполните следующий SQL код, заменив значения на ваши:

```sql
INSERT INTO super_admins (telegram_id, username, first_name, last_name, is_active)
VALUES 
    (YOUR_TELEGRAM_ID, 'your_username', 'Your', 'Name', true)
ON CONFLICT (telegram_id) DO UPDATE
SET 
    username = EXCLUDED.username,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    is_active = EXCLUDED.is_active;
```

### Пример:

```sql
INSERT INTO super_admins (telegram_id, username, first_name, last_name, is_active)
VALUES 
    (123456789, 'admin_user', 'Иван', 'Иванов', true)
ON CONFLICT (telegram_id) DO UPDATE
SET 
    username = EXCLUDED.username,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    is_active = EXCLUDED.is_active;
```

## Шаг 3: Проверьте добавление

Выполните запрос для проверки:

```sql
SELECT * FROM super_admins;
```

Вы должны увидеть вашу запись в таблице.

## Шаг 4: Войдите в систему

1. Откройте сайт Minutka
2. Нажмите кнопку "🔐 Kirish" (Вход)
3. Введите ваш Telegram ID
4. Вы будете автоматически перенаправлены в супер-админ панель (`/admin`)

## Примечания

- `telegram_id` - это ваш уникальный Telegram ID (обязательное поле)
- `username` - ваш Telegram username (опционально, можно указать `NULL`)
- `first_name` и `last_name` - ваше имя (опционально, можно указать `NULL`)
- `is_active` - должен быть `true` для активного доступа

## Добавление нескольких супер-админов

Если нужно добавить несколько супер-админов, используйте:

```sql
INSERT INTO super_admins (telegram_id, username, first_name, last_name, is_active)
VALUES 
    (123456789, 'admin1', 'Иван', 'Иванов', true),
    (987654321, 'admin2', 'Мария', 'Петрова', true),
    (555666777, 'admin3', 'Алексей', 'Сидоров', true)
ON CONFLICT (telegram_id) DO UPDATE
SET 
    username = EXCLUDED.username,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    is_active = EXCLUDED.is_active;
```

