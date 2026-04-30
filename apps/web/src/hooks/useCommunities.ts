import { useEffect, useState } from "react";
import type { Community } from "@crunedu/shared";
import { mapApiError } from "@/lib/http-client";
import { apiRequest } from "@/lib/http-client";

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

  async function fetchCommunities() {
    try {
      setError(null);
      const data = await apiRequest<Community[]>("/communities");
      setCommunities(data);
    } catch (err) {
      setError(mapApiError(err, "No se pudieron cargar las comunidades."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchCommunities();
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
