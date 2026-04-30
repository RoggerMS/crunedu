import type { Community, CreateFeedPostPayload, FeedPost } from "@crunedu/shared";
import { apiRequest } from "@/lib/http-client";

type LoginResponse = { accessToken: string };

type Question = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: { firstName: string | null; lastName: string | null; email: string };
  answers: Array<{ id: number; content: string }>;
};

type Product = {
  id: number;
  title: string;
  description: string;
  price: string;
  isFeatured: boolean;
  category: { name: string };
};

export type CatalogResponse = { items: Product[]; featuredProducts: Product[]; nextCursor: number | null };

export function login(email: string, password: string) {
  return apiRequest<LoginResponse>("/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
}

export function getFeedPosts(token: string) {
  return apiRequest<FeedPost[]>("/posts", { headers: { Authorization: `Bearer ${token}` } });
}

export function createFeedPost(payload: CreateFeedPostPayload, token: string) {
  return apiRequest<FeedPost>("/posts", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
}

export function getRecommendedCommunities(token: string) {
  return apiRequest<Community[]>("/communities/recommended", { headers: { Authorization: `Bearer ${token}` } });
}

export function createQuestion(payload: { title: string; content: string; communityId?: number }, token: string) {
  return apiRequest<Question>("/questions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
}

export function createAnswer(questionId: number, content: string, token: string) {
  return apiRequest(`/questions/${questionId}/answers`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ content }) });
}

export function getStoreCatalog(params: URLSearchParams) {
  return apiRequest<CatalogResponse>(`/marketplace/products?${params.toString()}`);
}

export function getStoreCategories() {
  return apiRequest<Array<{ id: number; name: string }>>("/marketplace/categories");
}

export function createAdminProduct(payload: Record<string, unknown>, token: string) {
  return apiRequest("/marketplace/admin/products", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
}
