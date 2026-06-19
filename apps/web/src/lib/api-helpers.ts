import type { Community, CreateFeedPostPayload, FeedPost } from "@crunedu/shared";
import { apiRequest, mapApiError } from "@/lib/http-client";

export { apiRequest, mapApiError };

type LoginResponse = { accessToken: string };
type RegisterResponse = { message: string; user: { id: number; email: string } };

type Question = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  isResolved?: boolean;
  author: { firstName: string | null; lastName: string | null; email: string };
  community?: { id: number; name: string } | null;
  images?: Array<{ id: number; imageUrl: string; mimeType: string; sizeBytes: number; position: number }>;
  answersCount?: number;
  answers: Array<{ id: number; content: string; createdAt?: string; isUseful?: boolean; author?: { firstName: string | null; lastName: string | null; email: string } }>;
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
export type AdminStoreInquiry = StoreInquiryResponse & {
  contactName: string;
  contactPhone: string;
  message: string;
  preferredContactMethod: "whatsapp" | "email";
  product: { id: number; title: string };
  user: { id: number; email: string };
};

export function login(email: string, password: string) {
  return apiRequest<LoginResponse>("/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
}

export function register(payload: { email: string; password: string; firstName: string; lastName: string }) {
  return apiRequest<RegisterResponse>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getFeedPosts(token: string) {
  return apiRequest<{ items: FeedPost[]; nextCursor: number | null; mode: "recent" | "relevant" }>("/posts", { headers: { Authorization: `Bearer ${token}` } });
}

function authJsonHeaders(token?: string): Record<string, string> {
  return token ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` } : { "Content-Type": "application/json" };
}

export function createFeedPost(payload: CreateFeedPostPayload, token: string) {
  return apiRequest<FeedPost>("/posts", { method: "POST", headers: authJsonHeaders(token), body: JSON.stringify(payload) });
}

export type UploadedPostImage = { imageUrl: string; storageKey: string; mimeType: string; sizeBytes: number };

export function uploadPostImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);
  return apiRequest<UploadedPostImage>("/posts/images", { method: "POST", body: formData });
}

export function getRecommendedCommunities(token: string) {
  return apiRequest<Community[]>("/communities/recommended", { headers: { Authorization: `Bearer ${token}` } });
}


export function createCommunity(payload: { name: string; description?: string; rules?: string; avatarUrl?: string; coverUrl?: string }, token: string) {
  return apiRequest<Community>("/communities", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
}

export type UploadedQuestionImage = { imageUrl: string; storageKey: string; mimeType: string; sizeBytes: number };
export type UploadedAnswerImage = UploadedQuestionImage;

export function uploadQuestionImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);
  return apiRequest<UploadedQuestionImage>("/questions/images", { method: "POST", body: formData });
}

export function uploadAnswerImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);
  return apiRequest<UploadedAnswerImage>("/questions/answers/images", { method: "POST", body: formData });
}

export function createQuestion(payload: { title: string; content: string; communityId?: number; images?: UploadedQuestionImage[] }, token: string) {
  return apiRequest<Question>("/questions", { method: "POST", headers: authJsonHeaders(token), body: JSON.stringify(payload) });
}

export function createAnswer(questionId: number, content: string, token: string, images?: UploadedAnswerImage[]) {
  return apiRequest(`/questions/${questionId}/answers`, { method: "POST", headers: authJsonHeaders(token), body: JSON.stringify({ content, images }) });
}

export function voteAnswer(questionId: number, answerId: number, value: -1 | 0 | 1, token: string) {
  return apiRequest(`/questions/${questionId}/answers/${answerId}/vote`, { method: "POST", headers: authJsonHeaders(token), body: JSON.stringify({ value }) });
}

export function createReport(payload: { targetType: "QUESTION" | "ANSWER" | "POST" | "COMMENT"; targetId: number; reason: string }, token: string) {
  return apiRequest("/reports", { method: "POST", headers: authJsonHeaders(token), body: JSON.stringify(payload) });
}

export function markAnswerUseful(questionId: number, answerId: number, token: string) {
  return apiRequest(`/questions/${questionId}/answers/${answerId}/useful`, { method: "PATCH", headers: token ? { Authorization: `Bearer ${token}` } : undefined });
}

export function getQuestionById(questionId: number) {
  return apiRequest<Question>(`/questions/${questionId}`);
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

export function getAdminStoreProducts(token: string) {
  return apiRequest<Array<StoreProduct & { status: string }>>("/marketplace/admin/products", { headers: { Authorization: `Bearer ${token}` } });
}

export function getAdminStoreInquiries(token: string) {
  return apiRequest<{ items: AdminStoreInquiry[]; nextCursor: number | null }>("/marketplace/admin/inquiries", { headers: { Authorization: `Bearer ${token}` } });
}

export function updateAdminStoreInquiryStatus(inquiryId: number, status: string, token: string) {
  return apiRequest(`/marketplace/admin/inquiries/${inquiryId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
}

export function getAdminStoreMetrics(token: string) {
  return apiRequest<{
    totals: { views: number; contactClicks: number; inquiries: number };
    inquirySummary: { total: number; completed: number };
  }>("/marketplace/admin/metrics", { headers: { Authorization: `Bearer ${token}` } });
}

export type UniversityContentApiItem = {
  id: number;
  type: string;
  title: string;
  description: string;
  area: string;
  category: string;
  visibility: string;
  statusTags: string[];
  startDate: string | null;
  endDate: string | null;
  deadline: string | null;
  time: string | null;
  location: string | null;
  cost: string | null;
  icon: string | null;
  steps: string[] | null;
  documents: string[] | null;
  schedule: string | null;
  warning: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  externalUrl: string | null;
  views: number;
  savesCount: number;
  createdAt: string;
};

export type UniversityContentListResponse = {
  items: UniversityContentApiItem[];
  nextCursor: number | null;
};

export type SuggestionPayload = {
  type: string;
  title: string;
  description: string;
  area?: string;
  date?: string;
  location?: string;
  externalUrl?: string;
};

export function getUniversityContent(query?: Record<string, string>) {
  const searchParams = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
  }
  const qs = searchParams.toString();
  return apiRequest<UniversityContentListResponse>(qs ? `/universidad?${qs}` : "/universidad");
}

export function getUniversityContentById(id: string | number) {
  return apiRequest<UniversityContentApiItem>(`/universidad/${id}`);
}

export function submitUniversitySuggestion(payload: SuggestionPayload) {
  return apiRequest<{ id: number; message: string }>("/universidad/sugerir", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
