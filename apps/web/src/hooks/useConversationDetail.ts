"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchConversationDetail } from "@/lib/conversations-api";
import { mapApiError } from "@/lib/http-client";
import type { ConversationDetail } from "@crunedu/shared";

export function useConversationDetail(id: number, inviteToken?: string) {
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConversationDetail(id, inviteToken);
      setConversation(data);
    } catch (err) {
      setError(mapApiError(err, "No se pudo cargar la conversación."));
    } finally {
      setLoading(false);
    }
  }, [id, inviteToken]);

  useEffect(() => {
    load();
  }, [load]);

  return { conversation, loading, error, refresh: load, setConversation };
}
