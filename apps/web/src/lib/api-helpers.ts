import type { Community, CreateFeedPostPayload, FeedPost } from "@crunedu/shared";
import { API_BASE_URL, apiRequest, buildApiUrl, mapApiError } from "@/lib/http-client";

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
  id: string;
  type: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  priceType: string;
  isNegotiable: boolean;
  condition: string | null;
  status: string;
  deliveryType: string;
  campus: string | null;
  course: string | null;
  brand: string | null;
  model: string | null;
  quantity: number;
  isFeatured: boolean;
  category: { id: number; slug: string; name: string; icon?: string | null };
  images: StoreImage[];
  seller: { id: string; name: string; avatarUrl?: string | null; rating?: number | null; verified?: boolean; sales?: number };
  safePoint: { id: number; name: string } | null;
  location: string | null;
  createdAt: string;
  publishedAt: string | null;
  stats: { views: number; saves: number; contacts: number };
  viewerState: { saved: boolean; isMine: boolean; canEdit: boolean; canDelete: boolean; canReport: boolean };
};

export type StoreImage = {
  id: number;
  imageUrl: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  position: number;
  isCover: boolean;
  altText?: string | null;
};

export type StoreCatalogResponse = {
  items: StoreProduct[];
  featuredProducts: StoreProduct[];
  nextCursor: number | null;
  filters: Record<string, string | number | null>;
};

export type StoreCategory = { id: number; name: string; slug: string; description?: string | null; icon?: string | null };
export type StoreSafePoint = { id: number; name: string; campus?: string | null; description?: string | null; reference?: string | null; schedule?: string | null };

export type StoreCreatePayload = {
  title: string;
  description: string;
  categoryId: number;
  type?: string;
  priceType?: string;
  price?: number;
  isNegotiable?: boolean;
  condition?: string;
  deliveryType?: string;
  campus?: string;
  district?: string;
  safePointId?: number;
  course?: string;
  brand?: string;
  model?: string;
  quantity?: number;
  status?: string;
  images?: StoreImageUpload[];
};

export type StoreImageUpload = {
  imageUrl: string;
  storageKey: string;
  mimeType?: string;
  sizeBytes?: number;
  altText?: string;
  isCover?: boolean;
};

export type StoreInquiryPayload = {
  message: string;
  quickMessageType?: string;
  preferredContactMethod?: string;
};

export type StoreReportPayload = {
  reason: string;
  description?: string;
};

export type StoreMeStatistics = {
  activeProducts: number;
  inquiriesReceived: number;
  inquiriesSent: number;
  favorites: number;
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

export function createReport(payload: { targetType: "QUESTION" | "ANSWER" | "POST" | "COMMENT" | "DOCUMENT"; targetId: number; reason: string; description?: string }, token: string) {
  return apiRequest("/reports", { method: "POST", headers: authJsonHeaders(token), body: JSON.stringify(payload) });
}

export function markAnswerUseful(questionId: number, answerId: number, token: string) {
  return apiRequest(`/questions/${questionId}/answers/${answerId}/useful`, { method: "PATCH", headers: token ? { Authorization: `Bearer ${token}` } : undefined });
}

export function getQuestionById(questionId: number) {
  return apiRequest<Question>(`/questions/${questionId}`);
}

export function updateQuestion(questionId: number, payload: { title?: string; content?: string; communityId?: number }, token: string) {
  return apiRequest<Question>(`/questions/${questionId}`, { method: "PATCH", headers: authJsonHeaders(token), body: JSON.stringify(payload) });
}

export function deleteQuestion(questionId: number, token: string) {
  return apiRequest<{ message: string }>(`/questions/${questionId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

function buildStoreCatalogUrl(params: Record<string, string | number | boolean | undefined | null>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
}

export function getStoreCatalog(query?: Record<string, string | number | boolean | undefined | null>) {
  const qs = query ? buildStoreCatalogUrl(query) : "";
  return apiRequest<StoreCatalogResponse>(qs ? `/marketplace/products?${qs}` : "/marketplace/products");
}

export function getStoreProductDetail(productId: number | string) {
  return apiRequest<StoreProduct>(`/marketplace/products/${productId}`);
}

export function getStoreCategories() {
  return apiRequest<StoreCategory[]>("/marketplace/categories");
}

export function getStoreSafePoints() {
  return apiRequest<StoreSafePoint[]>("/marketplace/safe-points");
}

export function createStoreProduct(payload: StoreCreatePayload, token: string) {
  return apiRequest<StoreProduct>("/marketplace/products", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function updateStoreProduct(id: number | string, payload: Partial<StoreCreatePayload>, token: string) {
  return apiRequest<StoreProduct>(`/marketplace/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function deleteStoreProduct(id: number | string, token: string) {
  return apiRequest<{ message: string }>(`/marketplace/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function uploadStoreProductImage(file: File, token: string) {
  const formData = new FormData();
  formData.append("image", file);
  return apiRequest<{ imageUrl: string; storageKey: string; mimeType: string; sizeBytes: number }>(
    "/marketplace/products/images",
    { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData },
  );
}

export function favoriteStoreProduct(id: number | string, token: string) {
  return apiRequest<{ saved: boolean; favoriteCount: number }>(`/marketplace/products/${id}/favorite`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createStoreInquiry(productId: number | string, payload: StoreInquiryPayload, token: string) {
  return apiRequest(`/marketplace/products/${productId}/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function reportStoreProduct(productId: number | string, payload: StoreReportPayload, token: string) {
  return apiRequest(`/marketplace/products/${productId}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function publishStoreProduct(id: number | string, token: string) {
  return apiRequest<StoreProduct>(`/marketplace/products/${id}/publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function pauseStoreProduct(id: number | string, token: string) {
  return apiRequest<StoreProduct>(`/marketplace/products/${id}/pause`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function markProductSold(id: number | string, token: string) {
  return apiRequest<StoreProduct>(`/marketplace/products/${id}/mark-sold`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getStoreMyFavorites(token: string) {
  return apiRequest<StoreProduct[]>("/marketplace/me/favorites", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getStoreMyListings(token: string) {
  return apiRequest<StoreProduct[]>("/marketplace/me/listings", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getStoreMyInquiries(token: string) {
  return apiRequest<any[]>("/marketplace/me/inquiries", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getStoreMeStatistics(token: string) {
  return apiRequest<StoreMeStatistics>("/marketplace/me/statistics", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// --- Admin store helpers ---
export function createAdminProduct(payload: Record<string, unknown>, token: string) {
  return apiRequest("/marketplace/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function getAdminStoreProducts(token: string) {
  return apiRequest<any[]>("/marketplace/admin/products", { headers: { Authorization: `Bearer ${token}` } });
}

export function getAdminStoreInquiries(token: string) {
  return apiRequest<{ items: any[]; nextCursor: number | null }>("/marketplace/admin/inquiries", { headers: { Authorization: `Bearer ${token}` } });
}

export function updateAdminStoreInquiryStatus(inquiryId: number, status: string, token: string) {
  return apiRequest(`/marketplace/admin/inquiries/${inquiryId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
}

export function updateAdminProductStatus(productId: number, status: string, token: string) {
  return apiRequest(`/marketplace/admin/products/${productId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
}

export function getAdminStoreReports(token: string, cursor?: number, limit?: number) {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", String(cursor));
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  return apiRequest<{ items: any[]; nextCursor: number | null }>(qs ? `/marketplace/admin/reports?${qs}` : "/marketplace/admin/reports", { headers: { Authorization: `Bearer ${token}` } });
}

export function getAdminStoreMetrics(token: string) {
  return apiRequest<any>("/marketplace/admin/metrics", { headers: { Authorization: `Bearer ${token}` } });
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

export type NoteVisibility = "public" | "community" | "private";

export type NoteApiItem = {
  id: number;
  title: string;
  description: string | null;
  course: string | null;
  cycle: string | null;
  materialType: string | null;
  fileType: string;
  mimeType: string | null;
  originalName: string | null;
  sizeBytes: number;
  fileUrl: string;
  downloadUrl: string;
  visibility: NoteVisibility;
  createdAt: string;
  updatedAt?: string;
  author: { id: number; name: string };
  community: { id: number; name: string; slug: string } | null;
  tags: string[];
  stats: { downloads: number; saves: number; views: number };
  rating: { average: number; count: number; viewerRating: number | null };
  viewerState: { saved: boolean; isMine: boolean; canEdit: boolean; canDelete: boolean; canReport: boolean };
};

export type NoteListResponse = { items: NoteApiItem[]; nextCursor: number | null };

export type NoteListQuery = {
  q?: string;
  course?: string;
  materialType?: string;
  fileType?: string;
  communityId?: number;
  visibility?: NoteVisibility;
  saved?: boolean;
  mine?: boolean;
  sort?: "recent" | "most_saved" | "most_downloaded" | "best_rated";
  cursor?: number;
  limit?: number;
};

export type UploadedNoteFile = {
  fileUrl: string;
  storageKey: string;
  fileType: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
};

export type CreateNotePayload = {
  title: string;
  description?: string;
  course?: string;
  cycle?: string;
  materialType?: string;
  visibility: NoteVisibility;
  communityId?: number;
  tags?: string[];
  uploadedFile: UploadedNoteFile;
};

export type NoteContributor = { userId: number; name: string; publicNotes: number };

function buildNoteQuery(params: NoteListQuery = {}): string {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set("q", params.q);
  if (params.course) searchParams.set("course", params.course);
  if (params.materialType) searchParams.set("materialType", params.materialType);
  if (params.fileType) searchParams.set("fileType", params.fileType);
  if (params.communityId) searchParams.set("communityId", String(params.communityId));
  if (params.visibility) searchParams.set("visibility", params.visibility);
  if (params.saved) searchParams.set("saved", "true");
  if (params.mine) searchParams.set("mine", "true");
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.cursor) searchParams.set("cursor", String(params.cursor));
  if (params.limit) searchParams.set("limit", String(params.limit));
  return searchParams.toString();
}

export function getNotes(params?: NoteListQuery) {
  const query = buildNoteQuery(params);
  return apiRequest<NoteListResponse>(query ? `/apuntes?${query}` : "/apuntes");
}

export function getNoteById(id: number | string) {
  return apiRequest<NoteApiItem>(`/apuntes/${id}`);
}

export function getNoteContributors() {
  return apiRequest<NoteContributor[]>("/apuntes/contributors");
}

export function uploadNoteFile(file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<UploadedNoteFile>("/apuntes/files", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
}

export function createNote(payload: CreateNotePayload, token: string) {
  return apiRequest<NoteApiItem>("/apuntes", { method: "POST", headers: authJsonHeaders(token), body: JSON.stringify(payload) });
}

export function updateNote(id: number, payload: Partial<CreateNotePayload>, token: string) {
  return apiRequest<NoteApiItem>(`/apuntes/${id}`, { method: "PATCH", headers: authJsonHeaders(token), body: JSON.stringify(payload) });
}

export function deleteNote(id: number, token: string) {
  return apiRequest<{ message: string }>(`/apuntes/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

export function saveNote(id: number, token: string) {
  return apiRequest<{ saved: boolean }>(`/apuntes/${id}/save`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
}

export function unsaveNote(id: number, token: string) {
  return apiRequest<{ saved: boolean }>(`/apuntes/${id}/save`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
}

export function rateNote(id: number, value: number, token: string) {
  return apiRequest<{ average: number; count: number; viewerRating: number }>(`/apuntes/${id}/rating`, {
    method: "POST",
    headers: authJsonHeaders(token),
    body: JSON.stringify({ value }),
  });
}

export function buildNoteDownloadUrl(id: number | string): string {
  return buildApiUrl(`/apuntes/${id}/download`);
}

export function buildNoteFileUrl(fileUrl: string): string {
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  if (fileUrl.startsWith("/api/")) return `${new URL(API_BASE_URL).origin}${fileUrl}`;
  if (fileUrl.startsWith("/")) return `${API_BASE_URL}${fileUrl}`;
  return `${API_BASE_URL}/${fileUrl}`;
}
