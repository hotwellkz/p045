# Инструкции по деплою и настройке

## Переменные окружения для фронтенда

### Production (Netlify / Vercel / другой хостинг)

Установите переменную окружения:

```bash
VITE_API_BASE_URL=https://shortsai-backend-rhnx5gonwq-uc.a.run.app
```

**Важно:** Замените URL на актуальный URL вашего Cloud Run сервиса. Проверить можно командой:
```powershell
# PowerShell
gcloud run services describe shortsai-backend --region us-central1 --format 'value(status.url)'

# Или список всех сервисов
gcloud run services list --region us-central1 --format="table(metadata.name,status.url)"
```

### Development (локально)

В файле `.env.local` или `.env`:
```bash
VITE_API_BASE_URL=http://localhost:8080
```

## Переменные окружения для бэкенда (Cloud Run)

### Обязательные секреты

1. **FIREBASE_SERVICE_ACCOUNT** - JSON Service Account для Firebase (в одну строку)
   - Можно использовать Secret Manager или переменную окружения
   - Формат: `{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}`

2. **OPENAI_API_KEY** - API ключ OpenAI

### Опциональные

- `TELEGRAM_API_ID` - ID Telegram API (если используется Telegram)
- `TELEGRAM_API_HASH` - Hash Telegram API
- `FRONTEND_ORIGIN` - URL фронтенда (для CORS, по умолчанию берётся из whitelist)

## Проверка после деплоя

### 1. Проверка health endpoints

```powershell
# PowerShell - получить URL сервиса
$SERVICE_URL = gcloud run services describe shortsai-backend --region us-central1 --format 'value(status.url)'

# Базовый health
curl "$SERVICE_URL/health"

# Health с проверкой auth
curl "$SERVICE_URL/health/auth"
```

Ожидаемый ответ `/health/auth`:
- Если Firebase настроен: `{"ok":true,"code":"AUTH_OK",...}`
- Если Firebase не настроен: `{"ok":false,"code":"AUTH_UNAVAILABLE",...}`

### 2. Проверка диагностического endpoint

```powershell
$SERVICE_URL = gcloud run services describe shortsai-backend --region us-central1 --format 'value(status.url)'
curl "$SERVICE_URL/internal/debug/auth"
```

Показывает детальную информацию о состоянии Firebase Auth.

### 3. Проверка в браузере (DevTools → Network)

1. Откройте https://shortsai.ru
2. Откройте DevTools → Network
3. Проверьте запросы к API:
   - **Preflight (OPTIONS)** должен возвращать `204` (не 500)
   - **Основной запрос**:
     - Без токена → `401 Unauthorized` (не 500)
     - С валидным токеном → `200 OK`
     - Если Firebase не настроен → `503 AUTH_UNAVAILABLE` (не 500)

### 4. Проверка логов Cloud Run

```bash
gcloud run services logs read shortsai-backend --region us-central1 --limit 50
```

Ищите:
- `Firebase Admin initialized` - успешная инициализация
- `Firebase Admin not initialized` - проблема с credentials
- `authRequired: Firebase Admin not initialized` - детали ошибки auth

## Команды деплоя

### Backend (Cloud Run)

**Для PowerShell (Windows):**
```powershell
cd backend
gcloud builds submit --tag gcr.io/prompt-6a4fd/shorts-backend
gcloud run deploy shortsai-backend --image gcr.io/prompt-6a4fd/shorts-backend --platform managed --region us-central1 --allow-unauthenticated --port 8080 --memory 512Mi --cpu 1 --timeout 300 --max-instances 10
```

**Для Bash/Linux:**
```bash
cd backend
gcloud builds submit --tag gcr.io/prompt-6a4fd/shorts-backend
gcloud run deploy shortsai-backend \
  --image gcr.io/prompt-6a4fd/shorts-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10
```

### Frontend (Netlify)

После установки `VITE_API_BASE_URL` в настройках Netlify:

```bash
cd app
npm run build
# Деплой через Netlify CLI или через Git push
```

## Устранение проблем

### Проблема: Все запросы возвращают 500 "Authentication service unavailable"

**Причина:** Firebase Admin SDK не инициализирован

**Решение:**
1. Проверьте, что секрет `FIREBASE_SERVICE_ACCOUNT` установлен в Cloud Run:
   
   **Вариант 1: Через Secret Manager (рекомендуется)**
   
   Сначала создайте секрет (если его нет):
   ```powershell
   # Создать секрет из JSON файла
   gcloud secrets create firebase-service-account --data-file=path/to/service-account.json
   ```
   
   Затем подключите к Cloud Run:
   ```powershell
   gcloud run services update shortsai-backend --region us-central1 --update-secrets FIREBASE_SERVICE_ACCOUNT=firebase-service-account:latest
   ```
   
   **Вариант 2: Через переменную окружения (для тестирования)**
   
   ```powershell
   # Прочитать JSON файл и установить как переменную окружения
   $jsonContent = Get-Content path/to/service-account.json -Raw
   gcloud run services update shortsai-backend --region us-central1 --update-env-vars FIREBASE_SERVICE_ACCOUNT="$jsonContent"
   ```
   
   **Проверка текущих переменных:**
   ```powershell
   gcloud run services describe shortsai-backend --region us-central1 --format="value(spec.template.spec.containers[0].env)"
   ```

2. Проверьте формат JSON (должен быть валидным JSON в одну строку)
3. Проверьте логи: `gcloud run services logs read shortsai-backend --region us-central1`
4. Используйте `/internal/debug/auth` для диагностики

### Проблема: CORS ошибки в браузере

**Причина:** Фронт ходит на неправильный URL или CORS не настроен

**Решение:**
1. Проверьте `VITE_API_BASE_URL` на фронте
2. Убедитесь, что origin `https://shortsai.ru` в whitelist
3. Проверьте `/api/cors-test` endpoint

### Проблема: Запросы идут на старый URL (shortsai-backend-rhnx5gomq-uc.a.run.app)

**Причина:** Захардкожен старый URL или не установлена переменная окружения

**Решение:**
1. Установите `VITE_API_BASE_URL` в настройках хостинга фронта
2. Пересоберите и задеплойте фронт
3. Проверьте в консоли браузера (dev mode) - должен быть лог `[API Config] Using API base URL: ...`

