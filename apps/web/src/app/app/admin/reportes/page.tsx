"use client";

import { useMemo } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { AdminReportsTable } from "@/modules/admin-reports/components/AdminReportsTable";
import { useAdminReports } from "@/modules/admin-reports/hooks/useAdminReports";
import { useModerationActions } from "@/modules/admin-reports/hooks/useModerationActions";

function parseRole(token: string | null) {
  if (!token) return null;

  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    return JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    ).role ?? null;
  } catch {
    return null;
  }
}

export default function AdminReportsPage() {
  const { accessToken, isAuthenticated } = useAccessToken();
  const role = useMemo(() => parseRole(accessToken), [accessToken]);

  const { reports, loading, error, setError, loadReports } = useAdminReports(accessToken);
  const { actionLoadingId, moderate } = useModerationActions({
    accessToken,
    onError: setError,
    onSuccess: loadReports,
  });

  if (!isAuthenticated) {
    return <p className="text-sm text-slate-600">Inicia sesión para revisar reportes.</p>;
  }

  if (role !== "ADMIN") {
    return <p className="text-sm text-red-600">Solo administradores pueden acceder a esta vista.</p>;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <h1 className="text-2xl font-black">Moderación de reportes</h1>
      {loading ? <p className="mt-4 text-sm text-slate-500">Cargando reportes...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <AdminReportsTable
        reports={reports}
        actionLoadingId={actionLoadingId}
        onModerate={moderate}
      />
    </section>
  );
}
