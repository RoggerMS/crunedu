import { useState } from "react";
import {
  executeModerationAction,
  ModerationAction,
} from "../services/adminReportsApi";

type UseModerationActionsParams = {
  accessToken: string | null;
  onError: (message: string) => void;
  onSuccess: () => Promise<void>;
};

export function useModerationActions({
  accessToken,
  onError,
  onSuccess,
}: UseModerationActionsParams) {
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  async function moderate(reportId: number, action: ModerationAction) {
    if (!accessToken) {
      return;
    }

    setActionLoadingId(reportId);

    try {
      await executeModerationAction(accessToken, reportId, action);
      await onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setActionLoadingId(null);
    }
  }

  return { actionLoadingId, moderate };
}
