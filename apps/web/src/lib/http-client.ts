export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const ERROR_MESSAGES = {
  network: "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.",
  unauthorized: "Tu sesión expiró o no tienes permisos. Inicia sesión nuevamente.",
  forbidden: "No tienes permisos para realizar esta acción.",
  notFound: "No encontramos lo que estás buscando.",
  tooManyRequests: "Demasiadas solicitudes. Inténtalo en unos minutos.",
  server: "Estamos teniendo problemas en el servidor. Inténtalo más tarde.",
  generic: "Ocurrió un error inesperado.",
} as const;

export class HttpClientError extends Error {
  constructor(message: string, public readonly status?: number, public readonly requestId?: string) {
    super(requestId ? `${message} (ID: ${requestId})` : message);
    this.name = "HttpClientError";
  }
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function mapApiError(error: unknown, fallbackMessage?: string): string {
  if (error instanceof HttpClientError) {
    if (error.status === 401) return ERROR_MESSAGES.unauthorized;
    if (error.status === 403) return ERROR_MESSAGES.forbidden;
    if (!error.status) return ERROR_MESSAGES.network;

    const safeMessage = error.message.replace(/\s*\(ID:[^)]+\)\s*/gi, "").trim();
    if (
      safeMessage &&
      safeMessage !== ERROR_MESSAGES.generic &&
      safeMessage !== ERROR_MESSAGES.server &&
      safeMessage !== ERROR_MESSAGES.network
    ) {
      return safeMessage;
    }

    return fallbackMessage ?? ERROR_MESSAGES.generic;
  }

  if (error instanceof TypeError) {
    return ERROR_MESSAGES.network;
  }

  return fallbackMessage ?? ERROR_MESSAGES.generic;
}

function messageByStatus(status: number): string {
  if (status === 401) return ERROR_MESSAGES.unauthorized;
  if (status === 403) return ERROR_MESSAGES.forbidden;
  if (status === 404) return ERROR_MESSAGES.notFound;
  if (status === 429) return ERROR_MESSAGES.tooManyRequests;
  if (status >= 500) return ERROR_MESSAGES.server;
  return ERROR_MESSAGES.generic;
}

async function extractApiError(response: Response): Promise<HttpClientError> {
  const body = (await response.json().catch(() => null)) as {
    message?: string | string[];
    error?: string | { message?: string | string[] };
    requestId?: string;
  } | null;
  const rawMessage = body?.message ?? (typeof body?.error === "object" ? body.error.message : undefined);
  const message = Array.isArray(rawMessage) ? rawMessage.join(" ") : rawMessage;
  const fallback = messageByStatus(response.status);
  const requestId = body?.requestId ?? response.headers.get("x-request-id") ?? undefined;
  return new HttpClientError(message?.trim() ? message : fallback, response.status, requestId);
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(buildApiUrl(path), init);
    if (!response.ok) {
      throw await extractApiError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof HttpClientError) throw error;
    if (error instanceof TypeError) throw new HttpClientError(ERROR_MESSAGES.network);
    throw new HttpClientError(ERROR_MESSAGES.generic);
  }
}
