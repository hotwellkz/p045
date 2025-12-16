import { getAuthToken } from "../utils/auth";
import { API_BASE_URL } from "../config/api";

export interface GoogleDriveIntegrationStatus {
  connected: boolean;
  email?: string;
}

/**
 * Получает статус Google Drive интеграции
 */
export async function getGoogleDriveStatus(): Promise<GoogleDriveIntegrationStatus> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/google-drive-integration/status`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Получает URL для авторизации Google OAuth
 */
export async function getGoogleDriveAuthUrl(): Promise<{ url: string }> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/google-drive-integration/oauth/url`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Отключает Google Drive интеграцию
 */
export async function disconnectGoogleDrive(): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/google-drive-integration/disconnect`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
}

