import { useEffect, useState } from "react";
import type { Community } from "@crunedu/shared";

interface UseCommunitiesResult {
  communities: Community[];
  loading: boolean;
  error: string | null;
}

export function useCommunities(): UseCommunitiesResult {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

  useEffect(() => {
    const controller = new AbortController();

    async function fetchCommunities() {
      try {
        const response = await fetch(`${apiBaseUrl}/communities`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Error al cargar las comunidades");
        }
        const data = await response.json();
        setCommunities(data);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
          return;
        }

        if (!(err instanceof Error)) {
          setError("Error desconocido");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCommunities();

    return () => {
      controller.abort();
    };
  }, [apiBaseUrl]);

  return { communities, loading, error };
}
