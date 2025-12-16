# Сводка исправлений: Устранение ошибок 500 и настройка CORS

## ✅ Выполненные исправления

### 1. Исправлена обработка ошибок Auth (Backend)

**Проблема:** Запросы возвращали 500 "Authentication service unavailable" вместо корректных кодов ошибок.

**Решение:**
- ✅ Auth middleware теперь возвращает `503 AUTH_UNAVAILABLE` вместо `500` при недоступности Firebase
- ✅ Добавлено детальное логирование с контекстом (route, method, origin, requestId)
- ✅ OPTIONS запросы пропускаются без проверки токена

**Файлы:**
- `backend/src/middleware/auth.ts` - исправлена обработка ошибок
- `backend/src/services/firebaseAdmin.ts` - добавлены функции проверки инициализации

### 2. Настроен единый API Base URL (Frontend)

**Проблема:** Разные файлы использовали разные переменные окружения (`VITE_API_URL`, `VITE_BACKEND_URL`, `VITE_API_BASE_URL`), что приводило к запросам на неправильный URL.

**Решение:**
- ✅ Создан единый конфиг `app/src/config/api.ts`
- ✅ Все API файлы обновлены для использования единого конфига
- ✅ Добавлен диагностический лог в development режиме

**Файлы:**
- `app/src/config/api.ts` - новый единый конфиг
- Все файлы в `app/src/api/` - обновлены
- Компоненты и страницы - обновлены

### 3. Исправлен CORS (Backend)

**Проблема:** Preflight (OPTIONS) запросы возвращали 500.

**Решение:**
- ✅ Whitelist origins для production (`https://shortsai.ru`, `https://www.shortsai.ru`)
- ✅ Правильная обработка OPTIONS запросов (возвращает 204)
- ✅ Добавлен диагностический endpoint `/api/cors-test`

**Файлы:**
- `backend/src/index.ts` - CORS конфигурация

### 4. Добавлены диагностические endpoints

**Новые endpoints:**
- ✅ `GET /health/auth` - проверка состояния Firebase Auth
- ✅ `GET /internal/debug/auth` - детальная диагностика (dev only)
- ✅ `GET /api/cors-test` - проверка CORS конфигурации

**Файлы:**
- `backend/src/index.ts` - health endpoints
- `backend/src/routes/debugRoutes.ts` - диагностический endpoint

## 📋 Текущий статус

### Backend (Cloud Run)
- ✅ Деплоен: `shortsai-backend-00023-png`
- ✅ URL: `https://shortsai-backend-rhnx5gonwq-uc.a.run.app` (проверьте актуальный URL командой `gcloud run services describe shortsai-backend --region us-central1 --format 'value(status.url)'`)
- ⚠️ Firebase не настроен (нужно установить `FIREBASE_SERVICE_ACCOUNT`)

### Frontend
- ✅ Код обновлён для использования единого конфига
- ⚠️ Нужно установить `VITE_API_BASE_URL` в настройках хостинга

## 🔧 Что нужно сделать

### 1. Настроить Firebase в Cloud Run

**Вариант A: Через Secret Manager (рекомендуется)**
```powershell
# Создать секрет (если его нет)
gcloud secrets create firebase-service-account --data-file=path/to/service-account.json

# Подключить к Cloud Run
gcloud run services update shortsai-backend --region us-central1 --update-secrets FIREBASE_SERVICE_ACCOUNT=firebase-service-account:latest
```

**Вариант B: Через переменную окружения**
```powershell
$jsonContent = Get-Content path/to/service-account.json -Raw
gcloud run services update shortsai-backend --region us-central1 --update-env-vars FIREBASE_SERVICE_ACCOUNT="$jsonContent"
```

### 2. Настроить API URL на фронте

В настройках Netlify/Vercel установите:
```
VITE_API_BASE_URL=https://shortsai-backend-rhnx5gonwq-uc.a.run.app
```

**Важно:** Проверьте актуальный URL командой:
```powershell
gcloud run services describe shortsai-backend --region us-central1 --format 'value(status.url)'
```

Затем пересоберите и задеплойте фронт.

## ✅ Проверка после настройки

### В браузере (DevTools → Network):

1. **Preflight (OPTIONS)** должен возвращать `204` (не 500)
2. **Запрос без токена** → `401 Unauthorized` (не 500)
3. **Запрос с валидным токеном** → `200 OK`
4. **Если Firebase не настроен** → `503 AUTH_UNAVAILABLE` (не 500)

### Через curl:

```powershell
# Получить актуальный URL
$SERVICE_URL = gcloud run services describe shortsai-backend --region us-central1 --format 'value(status.url)'

# Проверка health/auth
curl "$SERVICE_URL/health/auth"

# Проверка диагностики
curl "$SERVICE_URL/internal/debug/auth"

# Проверка запроса без токена (должен быть 401)
curl "$SERVICE_URL/api/notifications/unread-count"
```

## 📝 Изменённые файлы

### Backend:
- `backend/src/middleware/auth.ts`
- `backend/src/services/firebaseAdmin.ts`
- `backend/src/index.ts`
- `backend/src/routes/debugRoutes.ts`

### Frontend:
- `app/src/config/api.ts` (новый)
- `app/src/api/*.ts` (все файлы)
- `app/src/pages/ChannelList/ChannelListPage.tsx`
- `app/src/pages/ChannelEdit/ChannelEditPage.tsx`
- `app/src/components/ChannelImportModal.tsx`
- `app/src/services/openaiScriptGenerator.ts`

## 🎯 Ожидаемый результат

После настройки Firebase и API URL:
- ✅ Нет ошибок 500 в браузере
- ✅ CORS работает корректно
- ✅ Запросы идут на правильный URL
- ✅ Auth возвращает правильные коды ошибок (401/403/503)
- ✅ Всё логируется для диагностики

