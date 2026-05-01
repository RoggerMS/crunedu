const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type ReportSeverity = "high" | "medium" | "low";
export type ReportStatus = "open" | "reviewing" | "resolved";

export type AdminReport = {
  id: number;
  reason: string;
  status: string;
  createdAt: string;
  severity: ReportSeverity;
  slaTargetHours: number;
  post: { id: number; communityId: number } | null;
  comment: { id: number; post: { communityId: number } } | null;
};

export type ModerationPayload = {
  status: ReportStatus;
  decision: "warning" | "temp_post_limit" | "suspension" | "dismiss";
  reason: string;
  sanctionHours?: number;
};

export type AdminReportFilters = {
  status?: ReportStatus;
  severity?: ReportSeverity;
  communityId?: number;
  dateFrom?: string;
  dateTo?: string;
};

export async function fetchAdminReports(accessToken: string, filters: AdminReportFilters = {}): Promise<AdminReport[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.communityId) params.set("communityId", String(filters.communityId));
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);

  const response = await fetch(`${apiBaseUrl}/reports?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error("No se pudieron cargar los reportes.");
  return (await response.json()) as AdminReport[];
}

export async function executeModeration(accessToken: string, reportId: number, payload: ModerationPayload): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/reports/${reportId}/moderate`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error("No se pudo aplicar la acción de moderación.");
}

export async function executeBulkModeration(accessToken: string, reportIds: number[], moderation: ModerationPayload): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/reports/bulk/moderate`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ reportIds, moderation }),
  });

  if (!response.ok) throw new Error("No se pudo aplicar la moderación masiva.");
}

export type AuditEntry = { id: number; action: string; reason: string; createdAt: string; moderator: { email: string } };
export async function fetchAuditTrail(accessToken: string, reportId: number): Promise<AuditEntry[]> {
  const response = await fetch(`${apiBaseUrl}/reports/${reportId}/audit`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error("No se pudo cargar el historial del reporte.");
  return (await response.json()) as AuditEntry[];
}
