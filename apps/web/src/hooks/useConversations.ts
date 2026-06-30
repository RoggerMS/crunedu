"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchConversations,
  fetchLiveConversations,
  fetchWaitingConversations,
  fetchDebateConversations,
  type ConversationFilters,
  type ConversationListItem,
} from "@/lib/conversations-api";
import { mapApiError } from "@/lib/http-client";

interface UseConversationsOptions {
  mode?: "all" | "live" | "waiting" | "debates";
  filters?: ConversationFilters;
  autoRefreshMs?: number;
  enabled?: boolean;
}

interface ConversationsState {
  items: ConversationListItem[];
  nextCursor: string | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
}

export function useConversations(options: UseConversationsOptions = {}) {
  const { mode = "all", filters, autoRefreshMs, enabled = true } = options;
  const [state, setState] = useState<ConversationsState>({
    items: [],
    nextCursor: null,
    loading: true,
    loadingMore: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const load = useCallback(async (reset = false) => {
    if (reset && abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({
      ...prev,
      loading: reset,
      loadingMore: !reset,
      error: null,
    }));

    try {
      const currentFilters = filtersRef.current ?? {};
      const cursor = reset ? undefined : state.nextCursor ?? undefined;
      const queryFilters = { ...currentFilters, cursor };
      let response;
      if (mode === "live") response = await fetchLiveConversations(controller.signal);
      else if (mode === "waiting") response = await fetchWaitingConversations(controller.signal);
      else if (mode === "debates") response = await fetchDebateConversations(controller.signal);
      else response = await fetchConversations(queryFilters, controller.signal);

      if (controller.signal.aborted) return;
      setState((prev) => ({
        items: reset ? response.items : [...prev.items, ...response.items],
        nextCursor: response.nextCursor,
        loading: false,
        loadingMore: false,
        error: null,
      }));
    } catch (err) {
      if (controller.signal.aborted) return;
      setState((prev) => ({
        ...prev,
        loading: false,
        loadingMore: false,
        error: mapApiError(err, "Error al cargar las conversaciones."),
      }));
    }
  }, [mode, state.nextCursor]);

  useEffect(() => {
    if (!enabled) return;
    load(true);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [load, enabled]);

  useEffect(() => {
    if (!autoRefreshMs || !enabled) return;
    const interval = setInterval(() => {
      if (!state.loadingMore && !state.loading) load(true);
    }, autoRefreshMs);
    return () => clearInterval(interval);
  }, [autoRefreshMs, enabled, load, state.loading, state.loadingMore]);

  const loadMore = useCallback(() => {
    if (state.nextCursor && !state.loadingMore) load(false);
  }, [state.nextCursor, state.loadingMore, load]);

  const refresh = useCallback(() => load(true), [load]);

  return {
    items: state.items,
    nextCursor: state.nextCursor,
    loading: state.loading,
    loadingMore: state.loadingMore,
    error: state.error,
    loadMore,
    refresh,
  };
}
