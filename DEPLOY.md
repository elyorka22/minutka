# Инструкция по деплою Minutka

Этот документ содержит пошаговые инструкции по деплою всех компонентов платформы Minutka.

## Архитектура деплоя

- **Frontend (Next.js)** → Vercel
- **Backend (Express API)** → Railway
- **Telegram Bot** → Railway
- **Database (PostgreSQL)** → Supabase

---

## 1. Подготовка Supabase (База данных)

### 1.1 Создание проекта в Supabase

1. Перейдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Запишите:
   - **Project URL** (например: `https://xxxxx.supabase.co`)
   - **Service Role Key** (в Settings → API)

### 1.2 Применение миграций

**Рекомендуемый способ (проще всего):**

1. В Supabase Dashboard перейдите в **SQL Editor**
2. Нажмите **New Query**
3. Откройте файл **`supabase/setup.sql`** из репозитория
4. Скопируйте весь код и вставьте в SQL Editor
5. Нажмите **Run** (или `Ctrl/Cmd + Enter`)

✅ Готово! База данных полностью настроена.

**Альтернативный способ (по миграциям):**

1. В Supabase Dashboard перейдите в **SQL Editor**
2. Выполните миграции в порядке:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_add_chefs_remove_restaurant_role.sql`

**Или используйте Supabase CLI:**
```bash
# Установите Supabase CLI
npm install -g supabase

# Войдите в Supabase
supabase login

# Свяжите проект
supabase link --project-ref your-project-ref

# Примените миграции
supabase db push
```

### 1.3 Настройка RLS (Row Level Security)

RLS политики уже включены в миграциях. Убедитесь, что они активны в Supabase Dashboard → Authentication → Policies.

---

## 2. Деплой Backend на Railway

### 2.1 Подготовка

1. Убедитесь, что в `backend/package.json` есть скрипты:
   - `build`: компиляция TypeScript
   - `start`: запуск сервера

2. Создайте файл `.env` в `backend/` на основе `backend/.env.example`

### 2.2 Деплой на Railway

1. Перейдите на [railway.app](https://railway.app)
2. Войдите через GitHub
3. Нажмите **New Project** → **Deploy from GitHub repo**
4. Выберите репозиторий и папку `backend/`
5. Railway автоматически определит Node.js проект

### 2.3 Настройка переменных окружения

В Railway Dashboard → Variables добавьте:

```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
API_BASE_URL=https://your-backend-domain.railway.app
```

### 2.4 Настройка домена

1. В Railway Dashboard → Settings → Networking
2. Нажмите **Generate Domain** или добавьте свой домен
3. Запишите URL (например: `https://minutka-backend.railway.app`)

### 2.5 Проверка деплоя

После деплоя проверьте:
```bash
curl https://your-backend-domain.railway.app/health
```

Должен вернуться: `{"status":"ok","timestamp":"..."}`

---

## 3. Деплой Telegram Bot на Railway

### 3.1 Создание Telegram бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям и получите **Bot Token**
4. Запишите **Bot Username** (например: `@minutka_bot`)

### 3.2 Деплой на Railway

1. В Railway создайте **новый сервис** в том же проекте
2. Выберите **Deploy from GitHub repo**
3. Выберите репозиторий и папку `bot/`

### 3.3 Настройка переменных окружения

В Railway Dashboard → Variables добавьте:

```env
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
PORT=3002
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
API_BASE_URL=https://your-backend-domain.railway.app
WEBHOOK_URL=https://your-bot-domain.railway.app
```

**Важно:** `WEBHOOK_URL` должен быть установлен после получения домена бота.

### 3.4 Настройка домена

1. В Railway Dashboard → Settings → Networking
2. Нажмите **Generate Domain** или добавьте свой домен
3. Запишите URL (например: `https://minutka-bot.railway.app`)

### 3.5 Настройка Webhook (опционально)

Если используете webhook вместо polling:

1. После деплоя бота, установите webhook:
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -d "url=https://your-bot-domain.railway.app/webhook"
```

2. Или используйте Railway автоматическую настройку webhook (если поддерживается)

### 3.6 Проверка деплоя

1. Откройте бота в Telegram: `https://t.me/your_bot_username`
2. Отправьте `/start`
3. Бот должен ответить

---

## 4. Деплой Frontend на Vercel

### 4.1 Подготовка

1. Убедитесь, что в `frontend/package.json` есть скрипты:
   - `build`: сборка Next.js
   - `start`: запуск production сервера

2. Обновите `frontend/lib/api.ts` чтобы использовать переменную окружения:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
```

### 4.2 Деплой на Vercel

1. Перейдите на [vercel.com](https://vercel.com)
2. Войдите через GitHub
3. Нажмите **Add New Project**
4. Импортируйте репозиторий
5. Настройте проект:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend/`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### 4.3 Настройка переменных окружения

В Vercel Dashboard → Settings → Environment Variables добавьте:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.railway.app
NEXT_PUBLIC_TELEGRAM_BOT=your_bot_username
```

**Важно:** Переменные с префиксом `NEXT_PUBLIC_` доступны в браузере.

### 4.4 Настройка домена

1. В Vercel Dashboard → Settings → Domains
2. Добавьте свой домен или используйте предоставленный Vercel домен
3. Запишите URL (например: `https://minutka.vercel.app`)

### 4.5 Обновление CORS в Backend

После получения домена frontend, обновите `CORS_ORIGIN` в Railway (Backend):

```env
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

Перезапустите Backend сервис в Railway.

### 4.6 Проверка деплоя

1. Откройте `https://your-frontend-domain.vercel.app`
2. Проверьте, что сайт загружается
3. Проверьте, что API запросы работают (откройте DevTools → Network)

---

## 5. Финальная настройка

### 5.1 Обновление ссылок

1. Обновите ссылку на бота в frontend (если используется)
2. Проверьте, что все ссылки указывают на правильные домены

### 5.2 Тестирование

1. **Frontend:**
   - Откройте сайт
   - Проверьте загрузку ресторанов
   - Проверьте работу корзины

2. **Backend:**
   - Проверьте `/health` endpoint
   - Проверьте `/api/restaurants` endpoint

3. **Bot:**
   - Откройте бота в Telegram
   - Отправьте `/start`
   - Создайте тестовый заказ

4. **Database:**
   - Проверьте данные в Supabase Dashboard
   - Убедитесь, что заказы сохраняются

### 5.3 Мониторинг

1. **Railway:**
   - Проверьте логи в Railway Dashboard
   - Настройте алерты (если нужно)

2. **Vercel:**
   - Проверьте логи в Vercel Dashboard
   - Настройте мониторинг производительности

3. **Supabase:**
   - Проверьте использование ресурсов
   - Настройте резервное копирование

---

## 6. Переменные окружения - Сводка

### Backend (Railway)
```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
API_BASE_URL=https://your-backend-domain.railway.app
```

### Bot (Railway)
```env
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
PORT=3002
WEBHOOK_URL=https://your-bot-domain.railway.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
API_BASE_URL=https://your-backend-domain.railway.app
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.railway.app
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username
```

---

## 7. Troubleshooting

### Backend не запускается
- Проверьте логи в Railway
- Убедитесь, что все переменные окружения установлены
- Проверьте, что порт правильный

### Bot не отвечает
- Проверьте логи в Railway
- Убедитесь, что `TELEGRAM_BOT_TOKEN` правильный
- Проверьте, что webhook установлен (если используется)

### Frontend не загружает данные
- Проверьте `NEXT_PUBLIC_API_BASE_URL`
- Проверьте CORS настройки в Backend
- Откройте DevTools → Console для ошибок

### Ошибки базы данных
- Проверьте, что миграции применены
- Убедитесь, что `SUPABASE_SERVICE_ROLE_KEY` правильный
- Проверьте RLS политики в Supabase

---

## 8. Обновление после деплоя

### Обновление кода
1. Сделайте изменения в коде
2. Закоммитьте и запушьте в GitHub
3. Railway и Vercel автоматически перезапустят сервисы

### Обновление миграций
1. Создайте новую миграцию в `supabase/migrations/`
2. Примените через Supabase Dashboard или CLI

### Обновление переменных окружения
1. Обновите переменные в Railway/Vercel Dashboard
2. Перезапустите сервисы

---

## 9. Полезные ссылки

- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

## 10. Безопасность

⚠️ **Важно:**
- Никогда не коммитьте `.env` файлы в Git
- Используйте Service Role Key только на backend
- Настройте CORS правильно
- Используйте HTTPS для всех сервисов
- Регулярно обновляйте зависимости

---

Готово! Ваша платформа Minutka должна быть полностью развернута и работать. 🚀

