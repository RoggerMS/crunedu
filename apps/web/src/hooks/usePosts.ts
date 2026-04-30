import { useEffect, useMemo, useState } from "react";
import type { FeedDiscoveryResponse, FeedPost } from "@crunedu/shared";
import { buildApiUrl, mapApiError } from "@/lib/api";

interface UsePostsResult {
  posts: FeedPost[];
  sections: FeedDiscoveryResponse["sections"];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  reload: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function usePosts(): UsePostsResult {
  const [sections, setSections] = useState<FeedDiscoveryResponse["sections"]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const posts = useMemo(
    () => sections.flatMap((section) => section.items),
    [sections],
  );

  async function fetchDiscovery(requestedPage: number, signal?: AbortSignal) {
    const params = new URLSearchParams({ page: String(requestedPage), perSection: "5" });
    const response = await fetch(buildApiUrl(`/posts/discovery?${params.toString()}`), { signal });
    if (!response.ok) throw new Error("No se pudo cargar el feed personalizado.");
    return (await response.json()) as FeedDiscoveryResponse;
  }

  async function loadInitial(signal?: AbortSignal) {
    try {
      setError(null);
      const data = await fetchDiscovery(1, signal);
      setSections(data.sections ?? []);
      setPage(data.pagination?.page ?? 1);
      setHasMore(Boolean(data.pagination?.hasNextPage));
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(mapApiError(err, "No se pudo cargar el feed personalizado."));
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await fetchDiscovery(nextPage);
      setSections((prev) => prev.map((section) => ({ ...section, items: [...section.items, ...(data.sections.find((s) => s.key === section.key)?.items ?? [])] })));
      setPage(data.pagination?.page ?? nextPage);
      setHasMore(Boolean(data.pagination?.hasNextPage));
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

  return { posts, sections, loading, loadingMore, hasMore, error, reload: async () => { setLoading(true); await loadInitial(); }, loadMore };
}
