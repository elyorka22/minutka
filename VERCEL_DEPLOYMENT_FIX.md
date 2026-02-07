# Решение проблемы "staged" в Vercel

Если деплой застрял на этапе "product : staged", это означает, что сборка прошла успешно, но деплой ждет подтверждения.

## Решения:

### 1. Проверьте Production Protection

В Vercel Dashboard:
1. Перейдите в **Settings** → **Deployment Protection**
2. Если включен **Production Protection**, деплой требует ручного подтверждения
3. Либо подтвердите деплой вручную, либо временно отключите защиту

### 2. Подтвердите деплой вручную

1. Откройте Vercel Dashboard
2. Перейдите в **Deployments**
3. Найдите деплой со статусом "Staged"
4. Нажмите **"Promote to Production"** или **"Deploy"**

### 3. Создайте новый деплой

Если деплой не продвигается:
1. В Vercel Dashboard → **Deployments**
2. Найдите последний успешный деплой (не staged)
3. Нажмите **"Redeploy"** или создайте новый деплой через:
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

### 4. Проверьте настройки проекта

В Vercel Dashboard → **Settings** → **General**:
- Убедитесь, что **Production Branch** установлен на `main`
- Проверьте, что **Auto-deploy** включен

### 5. Проверьте логи

В Vercel Dashboard → **Deployments** → выберите деплой → **Logs**:
- Проверьте, нет ли ошибок после сборки
- Убедитесь, что все проверки (checks) прошли успешно

## Быстрое решение:

Если нужно срочно задеплоить:
1. Откройте Vercel Dashboard
2. Settings → Deployment Protection → отключите для production
3. Или вручную подтвердите деплой в разделе Deployments

