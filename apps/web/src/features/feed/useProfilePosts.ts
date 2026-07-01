import { useCallback, useEffect, useState } from "react";
import { apiRequest, mapApiError } from "@/lib/http-client";
import { mapApiPostToFeedPost } from "@/features/feed/map-api-post";
import { getFeedRepository } from "@/features/feed/feed.service";
import type { FeedPost } from "@/features/feed/feed.types";
import type { FeedPost as ApiFeedPost } from "@crunedu/shared";

const repository = getFeedRepository();

type ProfilePostsResponse = {
  items: ApiFeedPost[];
  nextCursor: number | null;
};

export function useProfilePosts(userId: number, accessToken: string | null) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<ProfilePostsResponse>(`/users/${userId}/posts?limit=10`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      setPosts(data.items.map(mapApiPostToFeedPost));
      setNextCursor(data.nextCursor);
    } catch (e) {
      setError(mapApiError(e, "No se pudieron cargar las publicaciones."));
    } finally {
      setLoading(false);
    }
  }, [userId, accessToken]);

  useEffect(() => { void load(); }, [load]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await apiRequest<ProfilePostsResponse>(`/users/${userId}/posts?cursor=${nextCursor}&limit=10`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      setPosts((prev) => [...prev, ...data.items.map(mapApiPostToFeedPost)]);
      setNextCursor(data.nextCursor);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [userId, nextCursor, loadingMore, accessToken]);

  const likePost = async (postId: string) => {
    const post = posts.find((item) => item.id === postId);
    if (!post) return;
    const updated = post.viewerState.liked ? await repository.unlikePost(postId) : await repository.likePost(postId);
    setPosts((prev) => prev.map((item) => item.id === postId ? updated : item));
  };

  const savePost = async (postId: string) => {
    const post = posts.find((item) => item.id === postId);
    if (!post) return;
    const updated = post.viewerState.saved ? await repository.unsavePost(postId) : await repository.savePost(postId);
    setPosts((prev) => prev.map((item) => item.id === postId ? updated : item));
  };

  const deletePost = async (postId: string) => {
    await repository.deletePost(postId);
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  const sharePost = async (postId: string) => {
    const updated = await repository.sharePost(postId);
    setPosts((prev) => prev.map((item) => item.id === postId ? updated : item));
  };

  const updatePost = async (post: FeedPost) => {
    const updated = await repository.updatePost(post);
    setPosts((prev) => prev.map((item) => item.id === post.id ? updated : item));
    return updated;
  };

  const reportPost = async (postId: string, reason: string, detail?: string) => repository.reportPost(postId, reason, detail);
  const hidePost = async (postId: string) => { await repository.hidePost(postId); setPosts((prev) => prev.filter((item) => item.id !== postId)); };

  return { posts, loading, error, nextCursor, loadingMore, load, loadMore, likePost, savePost, deletePost, sharePost, updatePost, reportPost, hidePost };
}
