# 🔥 Быстрое исправление: Настройка Firebase для устранения 503 ошибок

## Проблема

Все запросы к API возвращают `503 Service Unavailable` с сообщением "Firebase Admin not initialized".

## Решение

### Шаг 1: Проверьте наличие секрета Firebase

```powershell
gcloud secrets list --filter="name~firebase"
```

### Шаг 2: Создайте секрет (если его нет)

Если у вас есть JSON файл service account:

```powershell
gcloud secrets create firebase-service-account --data-file=path/to/service-account.json
```

**Важно:** Замените `path/to/service-account.json` на реальный путь к вашему файлу.

### Шаг 3: Подключите секрет к Cloud Run

```powershell
gcloud run services update shortsai-backend --region us-central1 --update-secrets FIREBASE_SERVICE_ACCOUNT=firebase-service-account:latest
```

### Шаг 4: Проверьте результат

```powershell
# Получить URL сервиса
$SERVICE_URL = gcloud run services describe shortsai-backend --region us-central1 --format 'value(status.url)'

# Проверить health/auth
curl "$SERVICE_URL/health/auth"

# Должен вернуть: {"ok":true,"code":"AUTH_OK",...}
```

### Шаг 5: Проверьте в браузере

1. Обновите страницу https://shortsai.ru
2. Откройте DevTools → Network
3. Проверьте, что запросы теперь возвращают `200` или `401` (не `503`)

## Альтернативный способ: через переменную окружения

Если не хотите использовать Secret Manager:

```powershell
# Прочитать JSON файл
$jsonContent = Get-Content path/to/service-account.json -Raw

# Установить как переменную окружения
gcloud run services update shortsai-backend --region us-central1 --update-env-vars FIREBASE_SERVICE_ACCOUNT="$jsonContent"
```

## Проверка диагностики

После настройки проверьте детальную диагностику:

```powershell
$SERVICE_URL = gcloud run services describe shortsai-backend --region us-central1 --format 'value(status.url)'
curl "$SERVICE_URL/internal/debug/auth"
```

Должно показать:
- `firebaseInitialized: true`
- `firebaseAuthAvailable: true`
- `credentialSource: "FIREBASE_SERVICE_ACCOUNT"` или `"individual_env_variables"`

## Если всё ещё не работает

1. Проверьте логи Cloud Run:
   ```powershell
   gcloud run services logs read shortsai-backend --region us-central1 --limit 50
   ```

2. Ищите сообщения:
   - `Firebase Admin initialized` - успех
   - `Failed to parse FIREBASE_SERVICE_ACCOUNT JSON` - проблема с форматом JSON
   - `Firebase Admin not initialized` - проблема с credentials

3. Убедитесь, что JSON валидный:
   ```powershell
   Get-Content path/to/service-account.json | ConvertFrom-Json | ConvertTo-Json
   ```

## Настройка фронта

После настройки бэкенда убедитесь, что фронт использует правильный URL:

В настройках Netlify/Vercel установите:
```
VITE_API_BASE_URL=https://shortsai-backend-rhnx5gonwq-uc.a.run.app
```

Проверьте актуальный URL:
```powershell
gcloud run services describe shortsai-backend --region us-central1 --format 'value(status.url)'
```


