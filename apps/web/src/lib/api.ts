import { HttpClientError, ERROR_MESSAGES } from "@/lib/http-client";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const USER_ERROR_MESSAGES = {
  network: "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.",
  unauthorized: "Tu sesión expiró. Inicia sesión nuevamente para continuar.",
  forbidden: "No tienes permiso para realizar esta acción.",
  generic: "Ocurrió un error inesperado. Inténtalo nuevamente.",
} as const;

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function mapApiError(error: unknown, fallbackMessage?: string): string {
  if (error instanceof HttpClientError) {
    if (error.status === 401) return USER_ERROR_MESSAGES.unauthorized;
    if (error.status === 403) return USER_ERROR_MESSAGES.forbidden;
    if (!error.status) return USER_ERROR_MESSAGES.network;

    const safeMessage = error.message.replace(/\s*\(ID:[^)]+\)\s*/gi, "").trim();
    if (
      safeMessage &&
      safeMessage !== ERROR_MESSAGES.generic &&
      safeMessage !== ERROR_MESSAGES.server &&
      safeMessage !== ERROR_MESSAGES.network
    ) {
      return safeMessage;
    }

    return fallbackMessage ?? USER_ERROR_MESSAGES.generic;
  }

  if (error instanceof TypeError) {
    return USER_ERROR_MESSAGES.network;
  }

  return fallbackMessage ?? USER_ERROR_MESSAGES.generic;
}
