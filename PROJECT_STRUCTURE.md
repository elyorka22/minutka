# Структура проекта

```
minutka/
├── frontend/                    # Next.js 14 Frontend
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Главная страница
│   │   ├── globals.css         # Глобальные стили
│   │   ├── not-found.tsx       # 404 страница
│   │   └── restaurants/
│   │       └── [id]/
│   │           └── page.tsx    # Страница ресторана
│   ├── components/
│   │   ├── RestaurantCard.tsx # Карточка ресторана
│   │   └── Banner.tsx          # Компонент баннера
│   ├── lib/
│   │   └── api.ts             # API клиент
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── .env.example
│
├── backend/                    # Express API
│   ├── src/
│   │   ├── index.ts           # Entry point
│   │   ├── config/
│   │   │   └── supabase.ts    # Supabase клиент
│   │   ├── routes/
│   │   │   ├── restaurants.ts # Роуты ресторанов
│   │   │   ├── orders.ts      # Роуты заказов
│   │   │   └── banners.ts     # Роуты баннеров
│   │   └── controllers/
│   │       ├── restaurants.ts # Контроллеры ресторанов
│   │       ├── orders.ts      # Контроллеры заказов
│   │       └── banners.ts     # Контроллеры баннеров
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── bot/                        # Telegram Bot
│   ├── src/
│   │   ├── index.ts           # Entry point
│   │   ├── config/
│   │   │   ├── supabase.ts    # Supabase клиент
│   │   │   └── api.ts         # Backend API клиент
│   │   ├── handlers/
│   │   │   ├── start.ts       # Обработчик /start
│   │   │   ├── restaurant.ts  # Обработчик выбора ресторана
│   │   │   ├── order.ts       # Обработчик текста заказа
│   │   │   ├── location.ts   # Обработчик адреса/геолокации
│   │   │   └── orderStatus.ts # Обработчик действий ресторана
│   │   ├── keyboards/
│   │   │   ├── restaurants.ts # Клавиатура ресторанов
│   │   │   └── orderActions.ts # Клавиатура действий заказа
│   │   └── services/
│   │       ├── restaurantNotification.ts # Уведомления ресторанам
│   │       └── userNotification.ts      # Уведомления пользователям
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── shared/                     # Общие типы
│   ├── types/
│   │   └── index.ts           # TypeScript типы
│   ├── package.json
│   └── tsconfig.json
│
├── supabase/                   # SQL миграции
│   └── migrations/
│       └── 001_initial_schema.sql # Начальная схема БД
│
├── README.md                   # Основной README
├── ARCHITECTURE.md             # Архитектура проекта
├── BOT_FLOW.md                 # Flow Telegram-бота
├── API_ENDPOINTS.md            # Документация API
├── SETUP.md                    # Инструкция по установке
├── PROJECT_STRUCTURE.md        # Этот файл
└── .gitignore
```

## Описание модулей

### Frontend (`frontend/`)

Next.js 14 приложение с App Router. Mobile-first дизайн с Tailwind CSS.

**Основные страницы:**
- `/` - Главная страница со списком ресторанов
- `/restaurants/[id]` - Страница ресторана

**Компоненты:**
- `RestaurantCard` - Карточка ресторана для списка
- `Banner` - Рекламный баннер

**API клиент:**
- `lib/api.ts` - Функции для работы с Backend API

### Backend (`backend/`)

Express.js REST API для работы с данными.

**Роуты:**
- `/api/restaurants` - Работа с ресторанами
- `/api/orders` - Работа с заказами
- `/api/banners` - Работа с баннерами

**Архитектура:**
- Routes → Controllers → Supabase
- Единый формат ответов
- Обработка ошибок

### Bot (`bot/`)

Telegram бот на Telegraf для обработки заказов.

**Handlers:**
- `start` - Инициализация, список ресторанов
- `restaurant` - Выбор ресторана
- `order` - Ввод заказа
- `location` - Адрес/геолокация
- `orderStatus` - Действия ресторана

**Services:**
- `restaurantNotification` - Отправка заказов ресторанам
- `userNotification` - Уведомления пользователям

**Keyboards:**
- Inline клавиатуры для выбора и действий

### Shared (`shared/`)

Общие TypeScript типы для всех модулей.

**Типы:**
- `Restaurant` - Ресторан
- `User` - Пользователь
- `Order` - Заказ
- `Banner` - Баннер
- `OrderStatus` - Статусы заказа

### Supabase (`supabase/`)

SQL миграции для создания схемы базы данных.

**Миграции:**
- `001_initial_schema.sql` - Создание всех таблиц, индексов, RLS, триггеров

## Зависимости между модулями

```
Frontend → Backend API
Bot → Backend API
Bot → Supabase (напрямую для пользователей)
Backend → Supabase
```

## Разделение ответственности

- **Frontend**: Отображение данных, UI/UX
- **Backend**: Бизнес-логика, валидация, работа с БД
- **Bot**: Взаимодействие с пользователями, уведомления
- **Shared**: Общие типы для типобезопасности



