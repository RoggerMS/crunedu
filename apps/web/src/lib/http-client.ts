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
  constructor(
    message: string,
    public readonly status?: number,
    public readonly requestId?: string,
    public readonly debugDetails?: string,
  ) {
    super(message);
    this.name = "HttpClientError";
  }
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function formatHttpDebug(error: HttpClientError): string {
  const details = [
    error.status ? `HTTP ${error.status}` : "HTTP sin estado",
    error.requestId ? `requestId=${error.requestId}` : null,
    error.debugDetails ? `detalle=${error.debugDetails}` : null,
  ].filter(Boolean);

  return `${error.message}\n${details.join(" | ")}`;
}

export function mapApiError(error: unknown, fallbackMessage?: string): string {
  if (error instanceof HttpClientError) {
    return formatHttpDebug(error);
  }

  if (error instanceof TypeError) {
    return `${ERROR_MESSAGES.network}\nDetalle: ${error.message}`;
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
  const textBody = await response.text().catch(() => "");
  let parsedBody: {
    message?: string | string[];
    error?: string | { message?: string | string[] };
    requestId?: string;
  } | null = null;

  if (textBody) {
    try {
      parsedBody = JSON.parse(textBody) as typeof parsedBody;
    } catch {
      parsedBody = null;
    }
  }

  const rawMessage = parsedBody?.message ?? (typeof parsedBody?.error === "object" ? parsedBody.error.message : parsedBody?.error);
  const message = Array.isArray(rawMessage) ? rawMessage.join(" ") : rawMessage;
  const fallback = messageByStatus(response.status);
  const requestId = parsedBody?.requestId ?? response.headers.get("x-request-id") ?? undefined;
  const debugDetails = textBody.trim() ? textBody.trim() : response.statusText;

  return new HttpClientError(message?.trim() ? message.trim() : fallback, response.status, requestId, debugDetails);
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
    if (error instanceof TypeError) throw new HttpClientError(ERROR_MESSAGES.network, undefined, undefined, error.message);
    throw new HttpClientError(ERROR_MESSAGES.generic);
  }
}
