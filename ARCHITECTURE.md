# Архитектура проекта Minutka

## Общая структура

```
kafeshka/
├── frontend/          # Next.js 14 (App Router) → Vercel
├── backend/           # Express API → Railway
├── bot/               # Telegram Bot (Telegraf) → Railway
├── shared/            # Общие TypeScript типы
└── supabase/          # SQL миграции для Supabase
```

## Технологический стек

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Database Client**: @supabase/supabase-js
- **Deployment**: Railway

### Bot
- **Framework**: Telegraf
- **Language**: TypeScript
- **Database Client**: @supabase/supabase-js
- **Deployment**: Railway

### Database
- **Provider**: Supabase (PostgreSQL)
- **Features**: RLS (Row Level Security), Triggers, Functions

## Схема базы данных

### Таблицы

1. **restaurants** - Рестораны
   - `id` (UUID, PK)
   - `name` (VARCHAR)
   - `description` (TEXT)
   - `working_hours` (JSONB)
   - `telegram_chat_id` (BIGINT) - для отправки заказов
   - `phone` (VARCHAR)
   - `is_active` (BOOLEAN)
   - `is_featured` (BOOLEAN) - для TOP ресторанов

2. **users** - Пользователи Telegram
   - `id` (UUID, PK)
   - `telegram_id` (BIGINT, UNIQUE)
   - `username` (VARCHAR)
   - `first_name`, `last_name` (VARCHAR)
   - `phone` (VARCHAR)

3. **orders** - Заказы
   - `id` (UUID, PK)
   - `restaurant_id` (UUID, FK → restaurants)
   - `user_id` (UUID, FK → users)
   - `order_text` (TEXT) - свободная форма заказа
   - `address` (TEXT)
   - `latitude`, `longitude` (DECIMAL)
   - `status` (VARCHAR) - pending, accepted, ready, delivered, cancelled
   - `telegram_message_id` (INTEGER) - ID сообщения для ресторана

4. **restaurant_admins** - Админы ресторанов
   - `id` (UUID, PK)
   - `restaurant_id` (UUID, FK → restaurants)
   - `telegram_id` (BIGINT)
   - `is_active` (BOOLEAN)

5. **banners** - Рекламные баннеры
   - `id` (UUID, PK)
   - `restaurant_id` (UUID, FK → restaurants, nullable)
   - `title` (VARCHAR)
   - `image_url` (TEXT)
   - `link_url` (TEXT)
   - `position` (VARCHAR) - homepage, restaurant_page, recommended
   - `is_active` (BOOLEAN)
   - `display_order` (INTEGER)

6. **order_status_history** - История статусов заказов
   - `id` (UUID, PK)
   - `order_id` (UUID, FK → orders)
   - `status` (VARCHAR)
   - `changed_by` (VARCHAR) - user, restaurant, system
   - `telegram_id` (BIGINT, nullable)
   - `created_at` (TIMESTAMP)

### Индексы

- `restaurants`: is_active, is_featured, telegram_chat_id
- `users`: telegram_id
- `orders`: restaurant_id, user_id, status, created_at
- `restaurant_admins`: restaurant_id, telegram_id
- `order_status_history`: order_id, created_at
- `banners`: restaurant_id, position, is_active, display_order

### RLS (Row Level Security)

- **restaurants**: Публичный доступ на чтение активных ресторанов
- **users**: Пользователи могут создавать свои записи
- **orders**: Публичный доступ на создание, пользователи видят свои заказы
- **banners**: Публичный доступ на чтение активных баннеров
- **restaurant_admins**: Доступ через service role key

## Flow Telegram-бота

### 1. Пользователь начинает заказ

```
Пользователь → /start
  ↓
Бот показывает список ресторанов (inline keyboard)
  ↓
Пользователь выбирает ресторан
  ↓
Бот запрашивает описание заказа
  ↓
Пользователь пишет заказ в свободной форме
  ↓
Бот запрашивает адрес/геолокацию
  ↓
Пользователь отправляет геолокацию или адрес текстом
```

### 2. Создание заказа

```
Бот получает все данные
  ↓
Создает/обновляет пользователя в БД
  ↓
Создает заказ через Backend API
  ↓
Сохраняет order_id и telegram_message_id
  ↓
Отправляет заказ ресторану в Telegram
```

### 3. Ресторан обрабатывает заказ

```
Ресторан получает сообщение с заказом
  ↓
Кнопки: "Принять" / "Отказ" / "Готово"
  ↓
Ресторан нажимает кнопку
  ↓
Бот обновляет статус через Backend API
  ↓
Бот обновляет сообщение для ресторана
  ↓
Бот уведомляет пользователя об изменении статуса
```

### 4. Статусы заказа

```
pending → accepted → ready → delivered
         ↓
      cancelled (в любой момент)
```

## Backend API Endpoints

### Restaurants

- `GET /api/restaurants`
  - Query params: `featured` (boolean)
  - Response: `{ success: true, data: Restaurant[] }`

- `GET /api/restaurants/:id`
  - Response: `{ success: true, data: Restaurant }`

### Orders

- `POST /api/orders`
  - Body: `{ restaurant_id, user_id, order_text, address?, latitude?, longitude? }`
  - Response: `{ success: true, data: Order }`

- `GET /api/orders/:id`
  - Response: `{ success: true, data: Order }`

- `PATCH /api/orders/:id/status`
  - Body: `{ status, changed_by?, telegram_id? }`
  - Response: `{ success: true, data: Order }`

### Banners

- `GET /api/banners`
  - Query params: `position` (string)
  - Response: `{ success: true, data: Banner[] }`

## Frontend Pages

### Главная страница (`/`)

- Список всех ресторанов
- Топ рестораны (featured)
- Рекламные баннеры (homepage)
- CTA кнопка "Сделать заказ" → Telegram-бот

### Страница ресторана (`/restaurants/:id`)

- Детали ресторана
- Описание
- Часы работы
- Кнопка "Заказать в Telegram"
- Блок "Рекомендуем сегодня" (banners с position=recommended)

## Переменные окружения

### Backend (.env)

```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CORS_ORIGIN=http://localhost:3000
```

### Bot (.env)

```env
TELEGRAM_BOT_TOKEN=your_bot_token
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
API_BASE_URL=http://localhost:3001
WEBHOOK_URL=your_webhook_url (для production)
PORT=3002
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username
```

## Деплой

### Frontend (Vercel)

1. Подключить репозиторий к Vercel
2. Установить переменные окружения
3. Деплой автоматический при push в main

### Backend + Bot (Railway)

1. Создать два проекта на Railway:
   - Backend API
   - Telegram Bot
2. Подключить репозитории
3. Установить переменные окружения
4. Для бота настроить webhook URL

### Database (Supabase)

1. Создать проект на Supabase
2. Выполнить миграции из `supabase/migrations/`
3. Настроить RLS политики
4. Получить URL и Service Role Key

## Масштабирование

### Текущая архитектура поддерживает:

- Горизонтальное масштабирование Backend API
- Множественные инстансы бота (через webhook)
- Кэширование на уровне Frontend (Next.js)
- Индексы в БД для быстрых запросов

### Рекомендации для роста:

- Redis для кэширования и сессий
- Очереди (Bull/BullMQ) для обработки заказов
- Мониторинг (Sentry, LogRocket)
- CDN для статических ресурсов
- Rate limiting на API



