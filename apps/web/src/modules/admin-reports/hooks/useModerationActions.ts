import { useState } from "react";
import { executeBulkModeration, executeModeration, ModerationPayload } from "../services/adminReportsApi";

type UseModerationActionsParams = {
  accessToken: string | null;
  onError: (message: string) => void;
  onSuccess: () => Promise<void>;
};

const defaultModeration: ModerationPayload = {
  status: "resolved",
  decision: "warning",
  reason: "Revisión administrativa",
};

export function useModerationActions({ accessToken, onError, onSuccess }: UseModerationActionsParams) {
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  async function moderate(reportId: number) {
    if (!accessToken) return;
    setActionLoadingId(reportId);
    try {
      await executeModeration(accessToken, reportId, defaultModeration);
      await onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function moderateBulk(reportIds: number[]) {
    if (!accessToken || reportIds.length === 0) return;
    setBulkLoading(true);
    try {
      await executeBulkModeration(accessToken, reportIds, defaultModeration);
      await onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setBulkLoading(false);
    }
  }

  return { actionLoadingId, moderate, bulkLoading, moderateBulk };
}
