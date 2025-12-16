import * as admin from "firebase-admin";
import { Logger } from "../utils/logger";

let firebaseInitialized = false;
let firebaseError: Error | null = null;

// Инициализация Firebase Admin SDK
// Поддерживает два способа: через service account JSON или через переменные окружения
if (!admin.apps.length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountJson) {
      // Если есть JSON в переменной окружения (для Cloud Run / серверов)
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        firebaseInitialized = true;
        Logger.info("Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT env variable");
      } catch (parseError) {
        firebaseError = parseError as Error;
        Logger.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON", parseError);
      }
    } else {
      // Попытка инициализации через Application Default Credentials (для локальной разработки)
      // или через переменные окружения по отдельности
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
      
      if (projectId && clientEmail && privateKey) {
        try {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey
            })
          });
          firebaseInitialized = true;
          Logger.info("Firebase Admin initialized from individual env variables");
        } catch (initError) {
          firebaseError = initError as Error;
          Logger.error("Failed to initialize Firebase Admin from env variables", initError);
        }
        } else {
          // Попытка использовать Application Default Credentials (ADC) в Cloud Run
          // Это работает если сервис запущен в Cloud Run с правильным service account
          if (process.env.FIREBASE_USE_ADC === "true" || process.env.GOOGLE_CLOUD_PROJECT) {
            try {
              admin.initializeApp({
                projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || "prompt-6a4fd"
              });
              firebaseInitialized = true;
              Logger.info("Firebase Admin initialized using Application Default Credentials (ADC)");
            } catch (adcError) {
              firebaseError = adcError as Error;
              Logger.error("Failed to initialize Firebase Admin using ADC", adcError);
              firebaseInitialized = false;
            }
          } else {
            // Не пытаемся использовать Application Default Credentials без явной настройки
            // Это может привести к ошибкам при использовании Firestore
            Logger.warn(
              "Firebase Admin not initialized: no credentials provided. " +
              "Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, or FIREBASE_USE_ADC=true. " +
              "Endpoints requiring Firestore will return 503."
            );
            Logger.warn("Firebase Admin: missing env variables", {
              hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
              hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
              hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
              hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
              hasUseADC: process.env.FIREBASE_USE_ADC === "true",
              googleCloudProject: process.env.GOOGLE_CLOUD_PROJECT || "not set"
            });
            firebaseInitialized = false;
          }
        }
    }
  } catch (error) {
    firebaseError = error as Error;
    Logger.error("Failed to initialize Firebase Admin", error);
  }
} else {
  firebaseInitialized = true;
}

// Экспортируем db с проверкой инициализации
export const db = firebaseInitialized ? admin.firestore() : null;

// Функция для проверки доступности Firestore
export function isFirestoreAvailable(): boolean {
  return firebaseInitialized && db !== null;
}

// Функция для получения информации о подключении
export function getFirestoreInfo(): {
  initialized: boolean;
  projectId?: string;
  error?: string;
} {
  if (!firebaseInitialized) {
    return {
      initialized: false,
      error: firebaseError?.message || "Firebase Admin not initialized"
    };
  }
  
  const projectId = process.env.FIREBASE_PROJECT_ID || 
    (admin.apps[0]?.options?.projectId as string | undefined);
  
  return {
    initialized: true,
    projectId: projectId || "unknown"
  };
}

// Функция для получения ошибки инициализации
export function getFirebaseError(): Error | null {
  return firebaseError;
}

// Функция для проверки инициализации Firebase Auth (не только Firestore)
export function isFirebaseAuthAvailable(): boolean {
  return firebaseInitialized && admin.apps.length > 0;
}

// Функция для получения детальной информации об инициализации Auth
export function getFirebaseAuthInfo(): {
  initialized: boolean;
  projectId?: string;
  credentialSource?: string;
  error?: string;
  errorDetails?: {
    name: string;
    message: string;
    stack?: string;
  };
} {
  if (!firebaseInitialized) {
    return {
      initialized: false,
      error: firebaseError?.message || "Firebase Admin not initialized",
      errorDetails: firebaseError ? {
        name: firebaseError.name,
        message: firebaseError.message,
        stack: firebaseError.stack
      } : undefined
    };
  }
  
  const projectId = process.env.FIREBASE_PROJECT_ID || 
    (admin.apps[0]?.options?.projectId as string | undefined);
  
  let credentialSource = "unknown";
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    credentialSource = "FIREBASE_SERVICE_ACCOUNT";
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    credentialSource = "individual_env_variables";
  }
  
  return {
    initialized: true,
    projectId: projectId || "unknown",
    credentialSource
  };
}

