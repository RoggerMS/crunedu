import type { CreateFeedPostPayload, FeedPost as ApiFeedPost, PostComment as ApiPostComment } from "@crunedu/shared";
import { apiRequest } from "@/lib/http-client";
import { mapApiCommentToFeedComment, mapApiPostToFeedPost, mapApiPostsResponse, type ApiFeedPostsResponse } from "./map-api-post";
import type { FeedRepository } from "./feed.repository";
import type { FeedComment, FeedPost } from "./feed.types";

let cachedPosts: FeedPost[] = [];

function findCachedPost(postId: string): FeedPost {
  const post = cachedPosts.find((item) => item.id === postId);
  if (!post) throw new Error("Publicación no encontrada en el feed actual.");
  return post;
}

function replaceCachedPost(post: FeedPost): FeedPost {
  cachedPosts = cachedPosts.map((item) => (item.id === post.id ? post : item));
  return post;
}

function resolveCommunityId(input: Parameters<FeedRepository["createPost"]>[0]): number | undefined {
  const rawCommunityId = input.communityId ?? input.destination?.id;
  if (rawCommunityId === undefined || rawCommunityId === null || rawCommunityId === "") {
    return undefined;
  }

  const communityId = typeof rawCommunityId === "string" ? Number(rawCommunityId) : rawCommunityId;
  if (!Number.isInteger(communityId) || Number(communityId) < 1) {
    return undefined;
  }

  return Number(communityId);
}

export const apiFeedRepository: FeedRepository = {
  async listPosts() {
    const response = await apiRequest<ApiFeedPostsResponse>("/posts");
    cachedPosts = mapApiPostsResponse(response);
    return cachedPosts;
  },
  async createPost(input) {
    const communityId = resolveCommunityId(input);
    const payload: CreateFeedPostPayload = {
      ...(input.title?.trim() ? { title: input.title.trim() } : {}),
      content: input.content,
      ...(communityId ? { communityId } : {}),
      ...(input.attachments?.length
        ? {
            images: input.attachments
              .filter((attachment) => attachment.apiImageUrl && attachment.storageKey)
              .map((attachment) => ({
                imageUrl: attachment.apiImageUrl as string,
                storageKey: attachment.storageKey as string,
                mimeType: attachment.mimeType,
                sizeBytes: Math.max(1, attachment.size),
              })),
          }
        : {}),
    };
    const response = await apiRequest<ApiFeedPost>("/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const post = mapApiPostToFeedPost(response);
    cachedPosts = [post, ...cachedPosts.filter((item) => item.id !== post.id)];
    return post;
  },
  async updatePost(post) {
    const response = await apiRequest<ApiFeedPost>(`/posts/${post.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: post.content, communityId: post.destination.id }) });
    return replaceCachedPost(mapApiPostToFeedPost(response));
  },
  async deletePost(postId) {
    await apiRequest(`/posts/${postId}`, { method: "DELETE" });
    cachedPosts = cachedPosts.filter((post) => post.id !== postId);
  },
  async likePost(postId) {
    const post = findCachedPost(postId);
    return replaceCachedPost({ ...post, stats: { ...post.stats, likes: post.stats.likes + 1 }, viewerState: { ...post.viewerState, liked: true } });
  },
  async unlikePost(postId) {
    const post = findCachedPost(postId);
    return replaceCachedPost({ ...post, stats: { ...post.stats, likes: Math.max(0, post.stats.likes - 1) }, viewerState: { ...post.viewerState, liked: false } });
  },
  async savePost(postId) {
    const post = findCachedPost(postId);
    return replaceCachedPost({ ...post, stats: { ...post.stats, saves: post.stats.saves + 1 }, viewerState: { ...post.viewerState, saved: true } });
  },
  async unsavePost(postId) {
    const post = findCachedPost(postId);
    return replaceCachedPost({ ...post, stats: { ...post.stats, saves: Math.max(0, post.stats.saves - 1) }, viewerState: { ...post.viewerState, saved: false } });
  },
  async listComments(postId) {
    const comments = await apiRequest<ApiPostComment[]>(`/posts/${postId}/comments`);
    return comments.map((comment) => mapApiCommentToFeedComment(comment, postId));
  },
  async addComment(postId, content, parentId) {
    const comment = await apiRequest<ApiPostComment>(`/posts/${postId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, parentId }) });
    return mapApiCommentToFeedComment(comment, postId);
  },
  async likeComment(postId) {
    return this.listComments(postId);
  },
  async reportPost(postId, reason, detail) {
    await apiRequest("/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: "POST",
        targetId: Number(postId),
        reason,
        ...(detail?.trim() ? { description: detail.trim() } : {}),
      }),
    });
  },
  async hidePost(postId) {
    cachedPosts = cachedPosts.filter((post) => post.id !== postId);
  },
  async sharePost(postId) {
    const post = findCachedPost(postId);
    return replaceCachedPost({ ...post, stats: { ...post.stats, shares: post.stats.shares + 1 } });
  },
};
