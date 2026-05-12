import { apiRequest } from "@/lib/http-client";
import type { FeedRepository } from "./feed.repository";
import type { CreateFeedPostInput, FeedComment, FeedPost } from "./feed.types";

const notReady = (method: string, error: unknown) => new Error(`Feed API ${method} no disponible: ${error instanceof Error ? error.message : "error desconocido"}`);

export const apiFeedRepository: FeedRepository = {
  async listPosts() { try { return await apiRequest<FeedPost[]>("/posts"); } catch (e) { throw notReady("GET /api/posts", e); } },
  async createPost(input) { try { return await apiRequest<FeedPost>("/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }); } catch (e) { throw notReady("POST /api/posts", e); } },
  async updatePost(post) { return apiRequest<FeedPost>(`/posts/${post.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(post) }); },
  async deletePost(postId) { await apiRequest(`/posts/${postId}`, { method: "DELETE" }); },
  async likePost(postId) { return apiRequest<FeedPost>(`/posts/${postId}/like`, { method: "POST" }); },
  async unlikePost(postId) { return apiRequest<FeedPost>(`/posts/${postId}/like`, { method: "DELETE" }); },
  async savePost(postId) { return apiRequest<FeedPost>(`/posts/${postId}/save`, { method: "POST" }); },
  async unsavePost(postId) { return apiRequest<FeedPost>(`/posts/${postId}/save`, { method: "DELETE" }); },
  async listComments(postId) { return apiRequest<FeedComment[]>(`/posts/${postId}/comments`); },
  async addComment(postId, content, parentId) { return apiRequest<FeedComment>(`/posts/${postId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, parentId }) }); },
  async likeComment(postId, commentId) { return apiRequest<FeedComment[]>(`/posts/${postId}/comments/${commentId}/like`, { method: "POST" }); },
  async reportPost(postId, reason, detail) { await apiRequest(`/posts/${postId}/report`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason, detail }) }); },
  async hidePost() {},
  async sharePost(postId) { return apiRequest<FeedPost>(`/posts/${postId}/share`, { method: "POST" }); },
};
