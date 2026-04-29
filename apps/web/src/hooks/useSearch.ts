import { useEffect, useState } from "react";
import type { SearchResults } from "@crunedu/shared";

const EMPTY_RESULTS: SearchResults = {
  query: "",
  posts: [],
  questions: [],
  communities: [],
};

export function useSearch(query: string) {
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

  useEffect(() => {
    const controller = new AbortController();
    const normalized = query.trim();

    if (!normalized) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      setError(null);
      return () => controller.abort();
    }

    async function fetchResults() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${apiBaseUrl}/search?q=${encodeURIComponent(normalized)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Error al buscar resultados");
        }

        const data = (await response.json()) as SearchResults;
        setResults(data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(err instanceof Error ? err.message : "Error inesperado al buscar");
      } finally {
        setLoading(false);
      }
    }

    fetchResults();

    return () => controller.abort();
  }, [apiBaseUrl, query]);

  return { results, loading, error };
}
