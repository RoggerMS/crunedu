const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type AdminReport = {
  id: number;
  reason: string;
  status: string;
  post: { id: number } | null;
  comment: { id: number } | null;
};

export type ModerationAction = "hide" | "restore";

export async function fetchAdminReports(accessToken: string): Promise<AdminReport[]> {
  const response = await fetch(`${apiBaseUrl}/reports`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("No se pudieron cargar los reportes.");
  }

  return (await response.json()) as AdminReport[];
}

export async function executeModerationAction(
  accessToken: string,
  reportId: number,
  action: ModerationAction,
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/reports/${reportId}/${action}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("No se pudo aplicar la acción de moderación.");
  }
}
