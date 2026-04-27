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

  useEffect(() => {
    async function fetchCommunities() {
      try {
        const response = await fetch("http://localhost:4000/api/communities");
        if (!response.ok) {
          throw new Error("Error al cargar las comunidades");
        }
        const data = await response.json();
        setCommunities(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    fetchCommunities();
  }, []);

  return { communities, loading, error };
}