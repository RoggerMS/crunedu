import { useEffect, useState } from "react";
import type { FeedPost } from "@crunedu/shared";

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
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

  async function fetchPosts(signal?: AbortSignal) {
    try {
      setError(null);
      const response = await fetch(`${apiBaseUrl}/posts`, {
        signal,
      });

      if (!response.ok) {
        throw new Error("Error al cargar las publicaciones");
      }

      const data = await response.json();
      setPosts(data);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      if (err instanceof Error) {
        setError(err.message);
        return;
      }

      setError("Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    fetchPosts(controller.signal);

    return () => {
      controller.abort();
    };
  }, [apiBaseUrl]);

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
