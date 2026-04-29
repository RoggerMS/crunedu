export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const NETWORK_ERROR_MESSAGE = "No se pudo conectar con el servidor";
export const GENERIC_ERROR_MESSAGE = "Ocurrió un error inesperado.";

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function mapApiError(error: unknown, fallbackMessage = GENERIC_ERROR_MESSAGE): string {
  if (error instanceof Error) {
    if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
      return NETWORK_ERROR_MESSAGE;
    }

    return error.message;
  }

  return fallbackMessage;
}

export async function readApiErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  const data = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
  const message = data?.message;

  if (Array.isArray(message)) {
    return message.join(" ");
  }

  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }

  return fallbackMessage;
}
