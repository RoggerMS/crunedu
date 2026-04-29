import { useEffect, useState } from "react";
import type { FeedQuestion } from "@crunedu/shared";

interface UseQuestionsResult {
  questions: FeedQuestion[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useQuestions(): UseQuestionsResult {
  const [questions, setQuestions] = useState<FeedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

  async function fetchQuestions(signal?: AbortSignal) {
    try {
      setError(null);
      const response = await fetch(`${apiBaseUrl}/questions`, { signal });
      if (!response.ok) throw new Error("Error al cargar las preguntas");
      setQuestions((await response.json()) as FeedQuestion[]);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    fetchQuestions(controller.signal);
    return () => controller.abort();
  }, [apiBaseUrl]);

  return { questions, loading, error, reload: async () => { setLoading(true); await fetchQuestions(); } };
}
