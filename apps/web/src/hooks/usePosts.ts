import { useEffect, useState } from "react";
import type { FeedPost } from "@crunedu/shared";
import { buildApiUrl, mapApiError } from "@/lib/api";

interface UsePostsResult {
  posts: FeedPost[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  reload: () => Promise<void>;
  loadMore: () => Promise<void>;
}

type PostsResponse = { items: FeedPost[]; nextCursor: number | null };

export function usePosts(): UsePostsResult {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchPosts(cursor?: number, signal?: AbortSignal) {
    const params = new URLSearchParams({ limit: "10" });
    if (cursor) params.set("cursor", String(cursor));
    const response = await fetch(buildApiUrl(`/posts?${params.toString()}`), { signal });
    if (!response.ok) throw new Error("No se pudieron cargar las publicaciones.");
    return (await response.json()) as PostsResponse;
  }

  async function loadInitial(signal?: AbortSignal) {
    try {
      setError(null);
      const data = await fetchPosts(undefined, signal);
      setPosts(data.items ?? []);
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(mapApiError(err, "No se pudieron cargar las publicaciones."));
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchPosts(nextCursor);
      setPosts((prev) => [...prev, ...(data.items ?? [])]);
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      setError(mapApiError(err, "No se pudieron cargar más publicaciones."));
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    loadInitial(controller.signal);
    return () => controller.abort();
  }, []);

  return { posts, loading, loadingMore, hasMore: nextCursor !== null, error, reload: async () => { setLoading(true); await loadInitial(); }, loadMore };
}
