import { useEffect, useState } from "react";
import type { FeedPost } from "@crunedu/shared";
import { buildApiUrl, mapApiError } from "@/lib/api";

interface UsePostsResult {
  posts: FeedPost[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function usePosts(): UsePostsResult {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchPosts(signal?: AbortSignal) {
    try {
      setError(null);
      const response = await fetch(buildApiUrl("/posts"), { signal });

      if (!response.ok) {
        throw new Error("No se pudieron cargar las publicaciones.");
      }

      const data = await response.json();
      setPosts(data);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(mapApiError(err, "No se pudieron cargar las publicaciones."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    fetchPosts(controller.signal);
    return () => controller.abort();
  }, []);

  return {
    posts,
    loading,
    error,
    reload: async () => {
      setLoading(true);
      await fetchPosts();
    },
  };
}
