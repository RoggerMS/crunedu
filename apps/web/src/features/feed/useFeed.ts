import { useCallback, useEffect, useState } from "react";
import { mapApiError } from "@/lib/http-client";
import { getFeedRepository } from "./feed.service";
import type { CreateFeedPostInput, FeedComment, FeedPost } from "./feed.types";

const repository = getFeedRepository();

export function useFeed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, FeedComment[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try { const loadedPosts = await repository.listPosts();
      const commentsEntries = await Promise.all(loadedPosts.map(async (post) => {
        try {
          return [post.id, await repository.listComments(post.id)] as const;
        } catch {
          return [post.id, []] as const;
        }
      }));
      setPosts(loadedPosts);
      setCommentsByPost(Object.fromEntries(commentsEntries));
      setError(null); } catch (e) { setError(mapApiError(e, "No se pudo cargar el feed.")); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);

  const createPost = async (input: CreateFeedPostInput) => { const post = await repository.createPost(input); setPosts((prev) => [post, ...prev]); return post; };
  const deletePost = async (postId: string) => { await repository.deletePost(postId); setPosts((prev) => prev.filter((post) => post.id !== postId)); };
  const likePost = async (postId: string) => { const post = posts.find((item) => item.id === postId); if (!post) return; const updated = post.viewerState.liked ? await repository.unlikePost(postId) : await repository.likePost(postId); setPosts((prev) => prev.map((item) => item.id === postId ? updated : item)); };
  const savePost = async (postId: string) => { const post = posts.find((item) => item.id === postId); if (!post) return; const updated = post.viewerState.saved ? await repository.unsavePost(postId) : await repository.savePost(postId); setPosts((prev) => prev.map((item) => item.id === postId ? updated : item)); };
  const addComment = async (postId: string, content: string, parentId?: string) => { const comment = await repository.addComment(postId, content, parentId); setCommentsByPost((prev) => ({ ...prev, [postId]: [comment, ...(prev[postId] ?? [])] })); setPosts((prev) => prev.map((item) => item.id === postId ? { ...item, stats: { ...item.stats, comments: item.stats.comments + 1 } } : item)); };
  const likeComment = async (postId: string, commentId: string) => { const updated = await repository.likeComment(postId, commentId); setCommentsByPost((prev) => ({ ...prev, [postId]: updated })); };
  const reportPost = async (postId: string, reason: string, detail?: string) => repository.reportPost(postId, reason, detail);
  const hidePost = async (postId: string) => { await repository.hidePost(postId); setPosts((prev) => prev.filter((item) => item.id !== postId)); };
  const sharePost = async (postId: string) => { const updated = await repository.sharePost(postId); setPosts((prev) => prev.map((item) => item.id === postId ? updated : item)); };

  return { posts, commentsByPost, loading, hydrated: !loading, error, createPost, deletePost, likePost, savePost, addComment, likeComment, reportPost, hidePost, sharePost, reload };
}
