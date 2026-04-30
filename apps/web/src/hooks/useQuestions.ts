import { useEffect, useState } from "react";
import type { FeedQuestion } from "@crunedu/shared";
import { mapApiError } from "@/lib/http-client";
import { apiRequest } from "@/lib/http-client";

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

  async function fetchQuestions(cursor?: number) {
    const params = new URLSearchParams({ limit: "10" });
    if (cursor) params.set("cursor", String(cursor));
    return apiRequest<QuestionsResponse>(`/questions?${params.toString()}`);
  }

  async function loadInitial() {
    try {
      setError(null);
      const data = await fetchQuestions();
      setQuestions(data.items ?? []);
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      setError(mapApiError(err, "No se pudieron cargar las preguntas."));
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
      setError(mapApiError(err, "No se pudieron cargar más preguntas."));
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    void loadInitial();
  }, []);

  return { questions, loading, loadingMore, hasMore: nextCursor !== null, error, loadMore, reload: async () => { setLoading(true); await loadInitial(); } };
}
