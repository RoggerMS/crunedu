import { useEffect, useState } from "react";
import type { FeedQuestion } from "@crunedu/shared";

interface UseQuestionsResult {
  questions: FeedQuestion[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  reload: () => Promise<void>;
  loadMore: () => Promise<void>;
}

type QuestionsResponse = { items: FeedQuestion[]; nextCursor: number | null };

export function useQuestions(): UseQuestionsResult {
  const [questions, setQuestions] = useState<FeedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

  async function fetchQuestions(cursor?: number, signal?: AbortSignal) {
    const params = new URLSearchParams({ limit: "10" });
    if (cursor) params.set("cursor", String(cursor));
    const response = await fetch(`${apiBaseUrl}/questions?${params.toString()}`, { signal });
    if (!response.ok) throw new Error("Error al cargar las preguntas");
    return (await response.json()) as QuestionsResponse;
  }

  async function loadInitial(signal?: AbortSignal) {
    try {
      setError(null);
      const data = await fetchQuestions(undefined, signal);
      setQuestions(data.items ?? []);
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchQuestions(nextCursor);
      setQuestions((prev) => [...prev, ...(data.items ?? [])]);
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    loadInitial(controller.signal);
    return () => controller.abort();
  }, [apiBaseUrl]);

  return { questions, loading, loadingMore, hasMore: nextCursor !== null, error, loadMore, reload: async () => { setLoading(true); await loadInitial(); } };
}
