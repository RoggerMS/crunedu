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

export type StoreProduct = {
  id: number;
  title: string;
  description: string;
  price: string;
  isFeatured: boolean;
  category: { name: string } | null;
};

export type StoreCatalogParams = {
  categoryId?: number;
  faculty?: string | null;
  career?: string | null;
  cursor?: number | null;
  limit?: number;
};

export type StoreInquiryPayload = {
  contactName: string;
  contactPhone: string;
  message: string;
  preferredContactMethod: "whatsapp" | "email";
};

export type StoreInquiryResponse = {
  id: number;
  productId: number;
  userId: number;
  status: string;
  createdAt: string;
};

export type CatalogResponse = {
  items: StoreProduct[];
  featuredProducts: StoreProduct[];
  nextCursor: number | null;
  context: { faculty: string; career: string };
};
export type ProductDetailResponse = StoreProduct & { contactMethod?: string; stock?: number; viewCount?: number };

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

function buildStoreCatalogParams(params: StoreCatalogParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.categoryId) searchParams.set("categoryId", String(params.categoryId));
  if (params.faculty?.trim()) searchParams.set("faculty", params.faculty.trim());
  if (params.career?.trim()) searchParams.set("career", params.career.trim());
  if (params.cursor) searchParams.set("cursor", String(params.cursor));
  if (params.limit) searchParams.set("limit", String(params.limit));

  return searchParams.toString();
}

export function getStoreCatalog(params?: StoreCatalogParams) {
  const query = buildStoreCatalogParams(params);
  return apiRequest<CatalogResponse>(query ? `/marketplace/products?${query}` : "/marketplace/products");
}

export function getStoreProductDetail(productId: number) {
  return apiRequest<ProductDetailResponse>(`/marketplace/products/${productId}`);
}

export function createStoreInquiry(
  productId: number,
  payload: StoreInquiryPayload,
  token: string,
) {
  return apiRequest<StoreInquiryResponse>(`/marketplace/products/${productId}/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function getStoreCategories() {
  return apiRequest<Array<{ id: number; name: string }>>("/marketplace/categories");
}

export function createAdminProduct(payload: Record<string, unknown>, token: string) {
  return apiRequest("/marketplace/admin/products", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
}
