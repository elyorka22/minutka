# Minutka - Платформа доставки еды через Telegram

MVP платформы доставки еды для города ~100 000 жителей.

## 🚀 Быстрый старт

### Локальная разработка
1. Установите зависимости: `cd backend && npm install && cd ../bot && npm install && cd ../frontend && npm install`
2. Настройте Supabase (см. `SETUP.md`)
3. Создайте Telegram-бота через @BotFather
4. Заполните `.env` файлы (см. `.env.example` в каждой папке)
5. Запустите: `npm run dev` в каждой папке (backend, bot, frontend)

Подробная инструкция: [SETUP.md](./SETUP.md)

### Деплой в production
Полная инструкция по деплою: [DEPLOY.md](./DEPLOY.md)

**Кратко:**
- **Frontend** → Vercel
- **Backend + Bot** → Railway
- **Database** → Supabase

## 📁 Архитектура проекта

```
kafeshka/
├── frontend/          # Next.js 14 (App Router) → Vercel
├── backend/           # Express API → Railway
├── bot/               # Telegram Bot (Telegraf) → Railway
├── shared/            # Общие TypeScript типы
└── supabase/          # SQL миграции для Supabase
```

## Технологический стек

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Bot**: Node.js, Telegraf, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Deployment**: 
  - Frontend → Vercel
  - Backend + Bot → Railway

## Структура базы данных

См. `supabase/migrations/` для SQL схемы.

Основные таблицы:
- `restaurants` - рестораны
- `users` - пользователи Telegram
- `orders` - заказы
- `restaurant_admins` - админы ресторанов
- `banners` - рекламные баннеры
- `order_status_history` - история статусов заказов

## Установка и запуск

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run dev
```

### Bot
```bash
cd bot
npm install
npm run dev
```

## Переменные окружения

См. `.env.example` в каждой директории.

## 📱 Flow Telegram-бота

1. Пользователь → `/start` → список ресторанов
2. Выбор ресторана → ввод заказа в свободной форме
3. Отправка геолокации/адреса → сохранение заказа
4. Ресторан получает уведомление → Принять/Отказ/Готово
5. Статусы: `pending` → `accepted` → `ready` → `delivered`

Подробное описание: [BOT_FLOW.md](./BOT_FLOW.md)

## 📚 Документация

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Архитектура проекта
- [BOT_FLOW.md](./BOT_FLOW.md) - Детальный flow Telegram-бота
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - Документация API
- [SETUP.md](./SETUP.md) - Инструкция по установке
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Структура проекта
- [DEPLOY.md](./DEPLOY.md) - 📦 Полная инструкция по деплою
- [DEPLOY_QUICKSTART.md](./DEPLOY_QUICKSTART.md) - 🚀 Быстрый деплой (краткая версия)

