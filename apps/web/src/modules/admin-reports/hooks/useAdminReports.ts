import { useCallback, useEffect, useState } from "react";
import { AdminReport, fetchAdminReports } from "../services/adminReportsApi";

export function useAdminReports(accessToken: string | null) {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextReports = await fetchAdminReports(accessToken);
      setReports(nextReports);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  return { reports, loading, error, setError, loadReports };
}
