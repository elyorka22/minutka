# Настройка игнорирования папки `mobile/` при деплое

Чтобы изменения в мобильном приложении (папка `mobile/`) не триггерили деплой на Vercel и Railway, нужно настроить игнорирование этой папки.

## Vercel

### Способ 1: Через Dashboard (рекомендуется)

1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **Settings** → **Git**
4. В разделе **Ignored Build Step** добавьте:
   ```bash
   git diff HEAD^ HEAD --quiet . frontend/ backend/ bot/ supabase/
   ```
   Это означает: деплой только если изменились файлы в `frontend/`, `backend/`, `bot/` или `supabase/`, но НЕ в `mobile/`

### Способ 2: Через vercel.json

В файле `frontend/vercel.json` можно добавить настройку (но лучше через dashboard).

## Railway

### Способ 1: Через Dashboard (рекомендуется)

1. Откройте [Railway Dashboard](https://railway.app)
2. Выберите проект **Backend**
3. Перейдите в **Settings** → **Source**
4. В разделе **Watch Paths** укажите:
   ```
   backend/**
   ```
   Это означает: деплой только если изменились файлы в папке `backend/`

5. Повторите для проекта **Bot**:
   - **Settings** → **Source** → **Watch Paths**: `bot/**`

### Способ 2: Через Root Directory

Убедитесь, что в настройках проекта указан правильный **Root Directory**:
- Backend: `backend/`
- Bot: `bot/`

Это автоматически игнорирует изменения вне этих папок.

## Проверка

После настройки:
1. Сделайте изменение в `mobile/` папке
2. Закоммитьте и запушьте
3. Проверьте, что Vercel и Railway НЕ запустили деплой

## Альтернатива: Использовать отдельную ветку

Можно также использовать отдельную ветку для мобильного приложения:
```bash
git checkout -b mobile
# Делайте изменения в mobile/
git push origin mobile
```

Но это менее удобно, чем настройка игнорирования.

