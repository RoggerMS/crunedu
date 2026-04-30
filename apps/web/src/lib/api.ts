import { HttpClientError, ERROR_MESSAGES } from "@/lib/http-client";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const NETWORK_ERROR_MESSAGE = ERROR_MESSAGES.network;
export const GENERIC_ERROR_MESSAGE = ERROR_MESSAGES.generic;

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function mapApiError(error: unknown, fallbackMessage = GENERIC_ERROR_MESSAGE): string {
  if (error instanceof HttpClientError) {
    return error.message;
  }

  if (error instanceof TypeError) {
    return NETWORK_ERROR_MESSAGE;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}
