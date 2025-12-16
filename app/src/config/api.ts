/**
 * Единый конфиг для API base URL
 * 
 * Переменные окружения (в порядке приоритета):
 * - VITE_API_BASE_URL - основной URL бэкенда (рекомендуется)
 * - VITE_API_URL - альтернативное имя (для совместимости)
 * - VITE_BACKEND_URL - ещё одно альтернативное имя
 * 
 * Production: должен указывать на правильный Cloud Run URL
 * Development: http://localhost:8080
 */

const getApiBaseUrl = (): string => {
  // Проверяем переменные окружения в порядке приоритета
  const apiBaseUrl = 
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL;
  
  if (apiBaseUrl) {
    // Убираем завершающий слеш если есть
    return apiBaseUrl.replace(/\/+$/, "");
  }
  
  // Fallback для development
  return "http://localhost:8080";
};

export const API_BASE_URL = getApiBaseUrl();

// Диагностический лог (всегда, чтобы видеть какой URL используется)
console.log("[API Config] Using API base URL:", API_BASE_URL);
if (import.meta.env.DEV) {
  console.log("[API Config] Environment variables:", {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "not set",
    VITE_API_URL: import.meta.env.VITE_API_URL || "not set",
    VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL || "not set"
  });
}




