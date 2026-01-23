# 🚀 Быстрый деплой Kafeshka

Краткая инструкция по деплою всех компонентов платформы.

## Порядок деплоя

1. **Supabase** (База данных)
2. **Backend** (Railway)
3. **Bot** (Railway)
4. **Frontend** (Vercel)

---

## 1. Supabase (5 минут)

1. Создайте проект на [supabase.com](https://supabase.com)
2. Запишите:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_SERVICE_ROLE_KEY` (Settings → API → Service Role Key)
3. В SQL Editor выполните миграции:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_add_chefs_remove_restaurant_role.sql`

---

## 2. Backend на Railway (10 минут)

1. Зайдите на [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Выберите репозиторий и папку `backend/`
3. В Variables добавьте:
   ```env
   PORT=3001
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend.vercel.app
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   API_BASE_URL=https://your-backend.railway.app
   ```
4. В Settings → Networking → Generate Domain
5. Запишите URL backend

---

## 3. Bot на Railway (10 минут)

1. Создайте бота через [@BotFather](https://t.me/BotFather) → `/newbot`
2. Запишите `TELEGRAM_BOT_TOKEN` и `BOT_USERNAME`
3. В Railway → New Service → Deploy from GitHub → папка `bot/`
4. В Variables добавьте:
   ```env
   TELEGRAM_BOT_TOKEN=your-bot-token
   PORT=3002
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   API_BASE_URL=https://your-backend.railway.app
   WEBHOOK_URL=https://your-bot.railway.app
   ```
5. В Settings → Networking → Generate Domain
6. Запишите URL bot

---

## 4. Frontend на Vercel (10 минут)

1. Зайдите на [vercel.com](https://vercel.com) → Add New Project
2. Импортируйте репозиторий
3. Настройте:
   - **Root Directory:** `frontend/`
   - **Framework:** Next.js
4. В Environment Variables добавьте:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://your-backend.railway.app
   NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username
   ```
5. Deploy
6. Запишите URL frontend

---

## 5. Финальная настройка

1. Обновите `CORS_ORIGIN` в Backend (Railway):
   ```env
   CORS_ORIGIN=https://your-frontend.vercel.app
   ```
2. Перезапустите Backend в Railway

---

## ✅ Проверка

- ✅ Frontend открывается: `https://your-frontend.vercel.app`
- ✅ Backend health: `https://your-backend.railway.app/health`
- ✅ Bot отвечает: `/start` в Telegram

---

## 📚 Подробная инструкция

См. [DEPLOY.md](./DEPLOY.md) для детальных инструкций и troubleshooting.

---

**Готово! 🎉**


