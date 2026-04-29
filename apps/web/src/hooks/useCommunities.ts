import { useEffect, useState } from "react";
import type { Community } from "@crunedu/shared";
import { buildApiUrl, mapApiError } from "@/lib/api";

interface UseCommunitiesResult {
  communities: Community[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useCommunities(): UseCommunitiesResult {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchCommunities(signal?: AbortSignal) {
    try {
      setError(null);
      const response = await fetch(buildApiUrl("/communities"), { signal });
      if (!response.ok) {
        throw new Error("Error al cargar las comunidades.");
      }
      const data = await response.json();
      setCommunities(data);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(mapApiError(err, "Error al cargar las comunidades."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    fetchCommunities(controller.signal);
    return () => controller.abort();
  }, []);

  return {
    communities,
    loading,
    error,
    reload: async () => {
      setLoading(true);
      await fetchCommunities();
    },
  };
}
