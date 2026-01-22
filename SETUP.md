# Инструкция по установке и запуску

## Предварительные требования

- Node.js 18+ и npm
- Аккаунт Supabase
- Telegram Bot Token (от @BotFather)
- Git

## Шаг 1: Клонирование и установка зависимостей

```bash
# Клонируйте репозиторий (если нужно)
cd kafeshka

# Установите зависимости для каждого модуля
cd backend && npm install && cd ..
cd bot && npm install && cd ..
cd frontend && npm install && cd ..
cd shared && npm install && cd ..
```

## Шаг 2: Настройка Supabase

1. Создайте проект на [Supabase](https://supabase.com)
2. Перейдите в SQL Editor
3. Выполните миграцию из `supabase/migrations/001_initial_schema.sql`
4. Скопируйте:
   - Project URL (SUPABASE_URL)
   - Service Role Key (SUPABASE_SERVICE_ROLE_KEY)

## Шаг 3: Создание Telegram-бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям
4. Скопируйте Bot Token

## Шаг 4: Настройка переменных окружения

### Backend

Создайте `backend/.env`:

```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CORS_ORIGIN=http://localhost:3000
```

### Bot

Создайте `bot/.env`:

```env
TELEGRAM_BOT_TOKEN=your_bot_token
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
API_BASE_URL=http://localhost:3001
# Для production:
# WEBHOOK_URL=https://your-bot.railway.app
# PORT=3002
```

### Frontend

Создайте `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username
```

## Шаг 5: Заполнение тестовых данных

Выполните SQL в Supabase SQL Editor:

```sql
-- Создать тестового пользователя
INSERT INTO users (telegram_id, username, first_name)
VALUES (123456789, 'testuser', 'Test User');

-- Создать тестовый ресторан
INSERT INTO restaurants (name, description, working_hours, telegram_chat_id, is_active, is_featured)
VALUES (
  'Пиццерия Италия',
  'Лучшая пицца в городе',
  '{"monday": "09:00-22:00", "tuesday": "09:00-22:00", "wednesday": "09:00-22:00", "thursday": "09:00-22:00", "friday": "09:00-22:00", "saturday": "10:00-23:00", "sunday": "10:00-23:00"}'::jsonb,
  123456789, -- Замените на реальный telegram_chat_id ресторана
  true,
  true
);

-- Создать админа ресторана
INSERT INTO restaurant_admins (restaurant_id, telegram_id, username, is_active)
SELECT id, 123456789, 'restaurant_admin', true
FROM restaurants
WHERE name = 'Пиццерия Италия'
LIMIT 1;
```

**Важно**: Замените `telegram_chat_id` и `telegram_id` на реальные значения.

## Шаг 6: Запуск приложений

### В отдельных терминалах:

**Терминал 1 - Backend:**
```bash
cd backend
npm run dev
```

**Терминал 2 - Bot:**
```bash
cd bot
npm run dev
```

**Терминал 3 - Frontend:**
```bash
cd frontend
npm run dev
```

## Шаг 7: Проверка работы

1. **Backend**: Откройте http://localhost:3001/health
   - Должен вернуть `{"status":"ok"}`

2. **Frontend**: Откройте http://localhost:3000
   - Должна загрузиться главная страница

3. **Bot**: Откройте бота в Telegram и отправьте `/start`
   - Должен показать список ресторанов

## Тестирование полного flow

1. Откройте бота в Telegram
2. Отправьте `/start`
3. Выберите ресторан
4. Напишите заказ (например: "Пицца Маргарита, 2 порции")
5. Отправьте геолокацию или адрес
6. Проверьте, что ресторан получил заказ
7. Нажмите "Принять" от имени ресторана
8. Проверьте, что пользователь получил уведомление

## Деплой

### Frontend на Vercel

1. Подключите репозиторий к Vercel
2. Установите переменные окружения:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`
3. Деплой произойдет автоматически

### Backend на Railway

1. Создайте проект на Railway
2. Подключите репозиторий
3. Укажите корневую папку: `backend`
4. Установите переменные окружения
5. Railway автоматически определит Node.js и запустит `npm start`

### Bot на Railway

1. Создайте отдельный проект на Railway
2. Подключите репозиторий
3. Укажите корневую папку: `bot`
4. Установите переменные окружения
5. Добавьте переменную `WEBHOOK_URL` с URL вашего Railway проекта
6. Railway автоматически определит Node.js и запустит `npm start`

## Troubleshooting

### Бот не отвечает

- Проверьте `TELEGRAM_BOT_TOKEN`
- Убедитесь, что бот запущен
- Проверьте логи в консоли

### Backend возвращает ошибки

- Проверьте `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY`
- Убедитесь, что миграции выполнены
- Проверьте RLS политики

### Frontend не загружает данные

- Проверьте `NEXT_PUBLIC_API_URL`
- Убедитесь, что Backend запущен
- Проверьте CORS настройки в Backend

### Ресторан не получает заказы

- Проверьте `telegram_chat_id` в таблице `restaurants`
- Убедитесь, что ресторан начал диалог с ботом
- Проверьте логи бота

## Полезные команды

```bash
# Проверка типов TypeScript
cd backend && npm run type-check
cd bot && npm run type-check
cd frontend && npm run type-check

# Сборка для production
cd backend && npm run build
cd bot && npm run build
cd frontend && npm run build
```


