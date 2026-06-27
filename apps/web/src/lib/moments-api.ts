import { apiRequest, buildApiUrl } from "@/lib/http-client";

export type MomentMediaType = "image" | "video";
export type MomentTypeApi =
  | "now" | "alert" | "food" | "humor" | "event" | "campus" | "community" | "lost_found";
export type MomentStatusApi = "active" | "expiring" | "expired";

export type MomentMediaApi = { id: string; type: MomentMediaType; url: string; alt: string | null };

export type MomentItemApi = {
  id: string;
  postId: string | null;
  title: string;
  description: string | null;
  type: MomentTypeApi;
  location: string | null;
  createdAt: string;
  expiresAt: string | null;
  isPermanent: boolean;
  inFeed: boolean;
  tags: string[];
  media: MomentMediaApi[];
  author: { id: string; name: string; avatarUrl: string | null };
  stats: { likes: number; confirmations: number; comments: number; shares: number; views: number };
  viewerState: { liked: boolean; saved: boolean; confirmed: boolean };
  status: MomentStatusApi;
  isMine: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export type MomentDetailApi = MomentItemApi & {
  recentComments: MomentCommentApi[];
};

export type MomentCommentApi = {
  id: string;
  momentId: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
  isMine: boolean;
};

export type MomentNewsSummaryApi = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  status: "active" | "in_progress" | "resolved";
  relatedMomentIds: string[];
  updatedAt: string;
  createdAt: string;
  stats: { likes: number; confirmations: number; comments: number; photos: number };
  coverImageUrl: string | null;
};

export type MomentNewsDetailApi = MomentNewsSummaryApi & {
  relatedMoments: MomentItemApi[];
};

export type MomentTrendApi = {
  position: number;
  tag: string;
  moments: number;
  likes: number;
  growth: number;
};

export type MomentTopicApi = { tag: string; count: number };

export type MomentListResponse = { items: MomentItemApi[]; nextCursor: number | null };

export type CreateMomentMediaPayload = {
  imageUrl: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
};

export type CreateMomentPayload = {
  title: string;
  description?: string;
  type?: MomentTypeApi;
  location?: string;
  tags?: string[];
  durationHours?: number;
  isPermanent?: boolean;
  shareToFeed?: boolean;
  media?: CreateMomentMediaPayload[];
};

export type UploadedMomentMedia = {
  imageUrl: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
};

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
}

export function getMoments(params?: {
  cursor?: number;
  limit?: number;
  sort?: "recent" | "relevant";
  q?: string;
  type?: MomentTypeApi;
  tag?: string;
  location?: string;
  withMedia?: boolean;
}): Promise<MomentListResponse> {
  const qs = buildQuery(params ?? {});
  return apiRequest<MomentListResponse>(qs ? `/moments?${qs}` : "/moments");
}

export function getMomentById(id: string | number): Promise<MomentDetailApi> {
  return apiRequest<MomentDetailApi>(`/moments/${id}`);
}

export function createMoment(payload: CreateMomentPayload): Promise<MomentItemApi> {
  return apiRequest<MomentItemApi>("/moments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateMoment(id: string | number, payload: Partial<CreateMomentPayload>): Promise<MomentItemApi> {
  return apiRequest<MomentItemApi>(`/moments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteMoment(id: string | number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/moments/${id}`, { method: "DELETE" });
}

export function uploadMomentMedia(file: File): Promise<UploadedMomentMedia> {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<UploadedMomentMedia>("/moments/media", { method: "POST", body: formData });
}

export function likeMoment(id: string | number): Promise<{ liked: boolean; count: number }> {
  return apiRequest(`/moments/${id}/like`, { method: "POST" });
}

export function unlikeMoment(id: string | number): Promise<{ liked: boolean; count: number }> {
  return apiRequest(`/moments/${id}/like`, { method: "DELETE" });
}

export function confirmMoment(id: string | number): Promise<{ confirmed: boolean; count: number }> {
  return apiRequest(`/moments/${id}/confirm`, { method: "POST" });
}

export function unconfirmMoment(id: string | number): Promise<{ confirmed: boolean; count: number }> {
  return apiRequest(`/moments/${id}/confirm`, { method: "DELETE" });
}

export function saveMoment(id: string | number): Promise<{ saved: boolean }> {
  return apiRequest(`/moments/${id}/save`, { method: "POST" });
}

export function unsaveMoment(id: string | number): Promise<{ saved: boolean }> {
  return apiRequest(`/moments/${id}/save`, { method: "DELETE" });
}

export function shareMoment(id: string | number): Promise<{ shares: number }> {
  return apiRequest(`/moments/${id}/share`, { method: "POST" });
}

export function shareMomentToFeed(id: string | number): Promise<{ inFeed: boolean }> {
  return apiRequest(`/moments/${id}/share-to-feed`, { method: "POST" });
}

export function removeMomentFromFeed(id: string | number): Promise<{ inFeed: boolean }> {
  return apiRequest(`/moments/${id}/share-to-feed`, { method: "DELETE" });
}

export function getMomentComments(id: string | number): Promise<MomentCommentApi[]> {
  return apiRequest<MomentCommentApi[]>(`/moments/${id}/comments`);
}

export function createMomentComment(id: string | number, content: string): Promise<MomentCommentApi> {
  return apiRequest<MomentCommentApi>(`/moments/${id}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

export function deleteMomentComment(momentId: string | number, commentId: string | number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/moments/${momentId}/comments/${commentId}`, { method: "DELETE" });
}

export function getMomentNews(): Promise<{ items: MomentNewsSummaryApi[] }> {
  return apiRequest<{ items: MomentNewsSummaryApi[] }>("/moments/news");
}

export function getMomentNewsDetail(id: string): Promise<MomentNewsDetailApi> {
  return apiRequest<MomentNewsDetailApi>(`/moments/news/${id}`);
}

export function getMomentGallery(params?: {
  cursor?: number;
  limit?: number;
  q?: string;
  type?: MomentTypeApi;
  location?: string;
}): Promise<MomentListResponse> {
  const qs = buildQuery(params ?? {});
  return apiRequest<MomentListResponse>(qs ? `/moments/gallery?${qs}` : "/moments/gallery");
}

export function getSavedMoments(params?: {
  cursor?: number;
  limit?: number;
  status?: "all" | "active" | "expired" | "with_photo";
  q?: string;
}): Promise<MomentListResponse> {
  const qs = buildQuery(params ?? {});
  return apiRequest<MomentListResponse>(qs ? `/moments/saved?${qs}` : "/moments/saved");
}

export function getMomentTrends(params?: { period?: "day" | "week" | "month"; limit?: number }): Promise<{ items: MomentTrendApi[]; period: string }> {
  const qs = buildQuery(params ?? {});
  return apiRequest(qs ? `/moments/trends?${qs}` : "/moments/trends");
}

export function getMomentTopics(): Promise<{ items: MomentTopicApi[] }> {
  return apiRequest<{ items: MomentTopicApi[] }>("/moments/topics");
}

export function buildMomentMediaUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/api/")) return `${new URL(buildApiUrl("/moments")).origin}${url}`;
  if (url.startsWith("/")) return `${buildApiUrl("/moments")}${url}`;
  return url;
}
