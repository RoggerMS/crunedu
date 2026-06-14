"use client";

import { useMemo, useState } from "react";
import { LoginRequiredNotice } from "@/components/auth/login-required-notice";
import { useAccessToken } from "@/hooks/useAccessToken";
import { AdminReportsTable } from "@/modules/admin-reports/components/AdminReportsTable";
import { useAdminReports } from "@/modules/admin-reports/hooks/useAdminReports";
import { useModerationActions } from "@/modules/admin-reports/hooks/useModerationActions";
import { fetchAuditTrail } from "@/modules/admin-reports/services/adminReportsApi";

function parseRole(token: string | null) { try { if (!token) return null; const [, payload] = token.split("."); if (!payload) return null; return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).role ?? null; } catch { return null; } }

export default function AdminReportsPage() {
  const { accessToken, isAuthenticated } = useAccessToken();
  const role = useMemo(() => parseRole(accessToken), [accessToken]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const [filters, setFilters] = useState({ status: "" as "" | "open" | "reviewing" | "resolved", severity: "" as "" | "high" | "medium" | "low", communityId: "", dateFrom: "", dateTo: "" });

  const { reports, loading, error, setError, loadReports } = useAdminReports(accessToken, {
    ...(filters.status ? { status: filters.status } : {}), ...(filters.severity ? { severity: filters.severity } : {}), ...(filters.communityId ? { communityId: Number(filters.communityId) } : {}), ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}), ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
  });
  const { actionLoadingId, moderate, bulkLoading, moderateBulk } = useModerationActions({ accessToken, onError: setError, onSuccess: loadReports });

  if (!isAuthenticated) return <LoginRequiredNotice title="Inicia sesión para revisar reportes." description="El panel de moderación requiere una cuenta con permisos." returnUrl="/app/admin/reportes" />;
  if (role !== "ADMIN") return <p className="text-sm text-red-600">Solo administradores pueden acceder a esta vista.</p>;

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <h1 className="text-2xl font-black">Moderación de reportes</h1>
      <p className="text-sm text-slate-600">SLA interno: alta 4h · media 24h · baja 72h.</p>
      <div className="grid gap-2 md:grid-cols-5">
        <select className="rounded-xl border px-3 py-2" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value as never }))}><option value="">Estado</option><option value="open">Abierto</option><option value="reviewing">En revisión</option><option value="resolved">Resuelto</option></select>
        <select className="rounded-xl border px-3 py-2" value={filters.severity} onChange={(e) => setFilters((p) => ({ ...p, severity: e.target.value as never }))}><option value="">Gravedad</option><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></select>
        <input className="rounded-xl border px-3 py-2" placeholder="Comunidad ID" value={filters.communityId} onChange={(e) => setFilters((p) => ({ ...p, communityId: e.target.value }))} />
        <input type="date" className="rounded-xl border px-3 py-2" value={filters.dateFrom} onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))} />
        <input type="date" className="rounded-xl border px-3 py-2" value={filters.dateTo} onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))} />
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><p className="font-semibold">Reglas iniciales anti-abuso</p><ul className="list-disc pl-5"><li>Spam repetitivo o enlaces engañosos: escalar a revisión inmediata.</li><li>Acoso, odio o amenazas: prioridad alta + evidencia.</li><li>Cuentas reincidentes: documentar y aplicar sanción progresiva.</li></ul></div>
      {loading ? <p className="mt-4 text-sm text-slate-500">Cargando reportes...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <AdminReportsTable reports={reports} selectedIds={selectedIds} actionLoadingId={actionLoadingId} bulkLoading={bulkLoading} onSelect={(id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])} onModerate={moderate} onModerateBulk={() => void moderateBulk(selectedIds)} onOpenAudit={async (id) => { if (!accessToken) return; const logs = await fetchAuditTrail(accessToken, id); setAuditLog(logs.map((entry) => `${new Date(entry.createdAt).toLocaleString("es-PE")} · ${entry.action} · ${entry.moderator?.email ?? "sin moderador"}`)); }} />
      {auditLog.length ? <div className="rounded-xl border border-slate-200 p-3"><p className="text-sm font-semibold">Historial de decisiones</p><ul className="mt-2 list-disc pl-5 text-xs text-slate-600">{auditLog.map((line) => <li key={line}>{line}</li>)}</ul></div> : null}
    </section>
  );
}
