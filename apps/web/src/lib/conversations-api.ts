import { apiRequest, buildApiUrl } from "@/lib/http-client";
import type {
  ConversationDetail,
  ConversationJoinResponse,
  ConversationListItem,
  ConversationListResponse,
  ConversationCompanion,
  ConversationRecordingItem,
  CreateConversationPayload,
  ConversationType,
  ConversationVisibility,
  ConversationParticipantRole,
  ConversationSpeakerRequest,
  ConversationInvite,
  ConversationDebateStance,
} from "@crunedu/shared";

export type {
  ConversationDetail,
  ConversationJoinResponse,
  ConversationListItem,
  ConversationListResponse,
  ConversationCompanion,
  ConversationRecordingItem,
  CreateConversationPayload,
  ConversationType,
  ConversationVisibility,
  ConversationParticipantRole,
  ConversationSpeakerRequest,
  ConversationInvite,
  ConversationDebateStance,
};

export const CONVERSAR_USE_MOCKS = process.env.NEXT_PUBLIC_CONVERSAR_USE_MOCKS === "true";
export const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "ws://localhost:7880";

export interface ConversationFilters {
  status?: string;
  type?: ConversationType;
  visibility?: ConversationVisibility;
  category?: string;
  course?: string;
  search?: string;
  createdBy?: number;
  cursor?: string;
  limit?: number;
  inviteToken?: string;
}

function toQuery(filters: ConversationFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.type) params.set("type", filters.type);
  if (filters.visibility) params.set("visibility", filters.visibility);
  if (filters.category) params.set("category", filters.category);
  if (filters.course) params.set("course", filters.course);
  if (filters.search) params.set("search", filters.search);
  if (filters.createdBy) params.set("createdBy", String(filters.createdBy));
  if (filters.cursor) params.set("cursor", filters.cursor);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.inviteToken) params.set("inviteToken", filters.inviteToken);
  const q = params.toString();
  return q ? `?${q}` : "";
}

// --- LISTING ---
export async function fetchConversations(filters: ConversationFilters = {}, signal?: AbortSignal): Promise<ConversationListResponse> {
  return apiRequest<ConversationListResponse>(`/conversations${toQuery(filters)}`, { signal });
}

export async function fetchLiveConversations(signal?: AbortSignal): Promise<ConversationListResponse> {
  return apiRequest<ConversationListResponse>("/conversations/live", { signal });
}

export async function fetchWaitingConversations(signal?: AbortSignal): Promise<ConversationListResponse> {
  return apiRequest<ConversationListResponse>("/conversations/waiting", { signal });
}

export async function fetchDebateConversations(signal?: AbortSignal): Promise<ConversationListResponse> {
  return apiRequest<ConversationListResponse>("/conversations/debates", { signal });
}

export async function fetchConversationDetail(id: number, inviteToken?: string, signal?: AbortSignal): Promise<ConversationDetail> {
  const q = inviteToken ? `?inviteToken=${encodeURIComponent(inviteToken)}` : "";
  return apiRequest<ConversationDetail>(`/conversations/${id}${q}`, { signal });
}

// --- CREATE / EDIT ---
export async function createConversation(payload: CreateConversationPayload): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>("/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function createDraft(payload: Partial<CreateConversationPayload>): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>("/conversations/drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateDraft(id: number, payload: Partial<CreateConversationPayload>): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>(`/conversations/drafts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function publishDraft(id: number): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>(`/conversations/drafts/${id}/publish`, { method: "POST" });
}

export async function updateConversation(id: number, payload: Partial<CreateConversationPayload>): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>(`/conversations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteConversation(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/conversations/${id}`, { method: "DELETE" });
}

// --- LIFECYCLE ---
export async function startConversation(id: number): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>(`/conversations/${id}/start`, { method: "POST" });
}

export async function endConversation(id: number): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>(`/conversations/${id}/end`, { method: "POST" });
}

export async function cancelConversation(id: number): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>(`/conversations/${id}/cancel`, { method: "POST" });
}

export async function joinConversation(id: number, inviteToken?: string): Promise<ConversationJoinResponse> {
  return apiRequest<ConversationJoinResponse>(`/conversations/${id}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inviteToken }),
  });
}

export async function leaveConversation(id: number): Promise<{ left: boolean }> {
  return apiRequest<{ left: boolean }>(`/conversations/${id}/leave`, { method: "POST" });
}

// --- SPEAKER REQUESTS ---
export async function raiseHand(id: number): Promise<unknown> {
  return apiRequest(`/conversations/${id}/speaker-requests`, { method: "POST" });
}

export async function cancelRaiseHand(id: number): Promise<{ cancelled: boolean }> {
  return apiRequest<{ cancelled: boolean }>(`/conversations/${id}/speaker-requests/me`, { method: "DELETE" });
}

export async function fetchSpeakerRequests(id: number): Promise<ConversationSpeakerRequest[]> {
  return apiRequest<ConversationSpeakerRequest[]>(`/conversations/${id}/speaker-requests`);
}

export async function approveSpeakerRequest(id: number, requestId: number): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>(`/conversations/${id}/speaker-requests/${requestId}/approve`, { method: "POST" });
}

export async function rejectSpeakerRequest(id: number, requestId: number): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>(`/conversations/${id}/speaker-requests/${requestId}/reject`, { method: "POST" });
}

// --- MODERATION ---
export async function updateParticipantRole(id: number, userId: number, role: ConversationParticipantRole): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>(`/conversations/${id}/participants/${userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
}

export async function muteParticipant(id: number, userId: number): Promise<{ muted: boolean }> {
  return apiRequest<{ muted: boolean }>(`/conversations/${id}/participants/${userId}/mute`, { method: "POST" });
}

export async function removeParticipant(id: number, userId: number): Promise<{ removed: boolean }> {
  return apiRequest<{ removed: boolean }>(`/conversations/${id}/participants/${userId}/remove`, { method: "POST" });
}

export async function banParticipant(id: number, userId: number, reason?: string): Promise<{ banned: boolean }> {
  return apiRequest<{ banned: boolean }>(`/conversations/${id}/participants/${userId}/ban`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
}

export async function unbanParticipant(id: number, userId: number): Promise<{ unbanned: boolean }> {
  return apiRequest<{ unbanned: boolean }>(`/conversations/${id}/bans/${userId}`, { method: "DELETE" });
}

export async function lockConversation(id: number): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>(`/conversations/${id}/lock`, { method: "POST" });
}

export async function unlockConversation(id: number): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>(`/conversations/${id}/lock`, { method: "DELETE" });
}

// --- INVITES ---
export async function createInvite(id: number, maxUses?: number, expiresInHours?: number): Promise<ConversationInvite> {
  return apiRequest<ConversationInvite>(`/conversations/${id}/invites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ maxUses, expiresInHours: expiresInHours ? String(expiresInHours) : undefined }),
  });
}

export async function fetchInvites(id: number): Promise<ConversationInvite[]> {
  return apiRequest<ConversationInvite[]>(`/conversations/${id}/invites`);
}

export async function revokeInvite(id: number, inviteId: number): Promise<{ revoked: boolean }> {
  return apiRequest<{ revoked: boolean }>(`/conversations/${id}/invites/${inviteId}`, { method: "DELETE" });
}

// --- MATERIALS ---
export async function fetchMaterials(id: number): Promise<unknown[]> {
  return apiRequest<unknown[]>(`/conversations/${id}/materials`);
}

export async function uploadMaterial(id: number, file: File): Promise<unknown> {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<unknown>(`/conversations/${id}/materials/upload`, {
    method: "POST",
    body: formData,
  });
}

export async function deleteMaterial(id: number, materialId: number): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/conversations/${id}/materials/${materialId}`, { method: "DELETE" });
}

// --- LINKS ---
export async function fetchLinks(id: number): Promise<unknown[]> {
  return apiRequest<unknown[]>(`/conversations/${id}/links`);
}

export async function createLink(id: number, title: string, url: string, type?: string): Promise<unknown> {
  return apiRequest<unknown>(`/conversations/${id}/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, url, type }),
  });
}

export async function deleteLink(id: number, linkId: number): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/conversations/${id}/links/${linkId}`, { method: "DELETE" });
}

// --- RECORDINGS ---
export async function fetchRecordings(filters?: { type?: ConversationType; category?: string; search?: string; sort?: string; limit?: number }, signal?: AbortSignal): Promise<{ items: ConversationRecordingItem[] }> {
  const params = new URLSearchParams();
  if (filters?.type) params.set("type", filters.type);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.sort) params.set("sort", filters.sort);
  if (filters?.limit) params.set("limit", String(filters.limit));
  const q = params.toString();
  return apiRequest<{ items: ConversationRecordingItem[] }>(`/conversations/recordings${q ? `?${q}` : ""}`, { signal });
}

export async function fetchRecording(id: number): Promise<ConversationRecordingItem> {
  return apiRequest<ConversationRecordingItem>(`/conversations/recordings/${id}`);
}

export async function playRecording(id: number): Promise<ConversationRecordingItem> {
  return apiRequest<ConversationRecordingItem>(`/conversations/recordings/${id}/play`, { method: "POST" });
}

export async function deleteRecording(id: number): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/conversations/recordings/${id}`, { method: "DELETE" });
}

export async function startRecording(id: number): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>(`/conversations/${id}/recordings/start`, { method: "POST" });
}

export async function stopRecording(id: number): Promise<ConversationDetail> {
  return apiRequest<ConversationDetail>(`/conversations/${id}/recordings/stop`, { method: "POST" });
}

// --- START SUBSCRIPTIONS ---
export async function subscribeToStart(id: number): Promise<{ subscribed: boolean }> {
  return apiRequest<{ subscribed: boolean }>(`/conversations/${id}/start-subscriptions`, { method: "POST" });
}

export async function unsubscribeFromStart(id: number): Promise<{ subscribed: boolean }> {
  return apiRequest<{ subscribed: boolean }>(`/conversations/${id}/start-subscriptions/me`, { method: "DELETE" });
}

// --- DEBATES ---
export async function fetchStances(id: number): Promise<ConversationDebateStance[]> {
  return apiRequest<ConversationDebateStance[]>(`/conversations/${id}/stances`);
}

export async function createStance(id: number, title: string, description?: string): Promise<unknown> {
  return apiRequest<unknown>(`/conversations/${id}/stances`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description }),
  });
}

export async function joinStance(id: number, stanceId: number): Promise<ConversationDebateStance[]> {
  return apiRequest<ConversationDebateStance[]>(`/conversations/${id}/stances/${stanceId}/join`, { method: "POST" });
}

export async function createArgument(id: number, stanceId: number, content: string): Promise<unknown> {
  return apiRequest<unknown>(`/conversations/${id}/stances/${stanceId}/arguments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

export async function updateArgument(id: number, argumentId: number, content: string): Promise<unknown> {
  return apiRequest<unknown>(`/conversations/${id}/arguments/${argumentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

export async function deleteArgument(id: number, argumentId: number): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/conversations/${id}/arguments/${argumentId}`, { method: "DELETE" });
}

// --- COMPANIONS ---
export async function fetchCompanions(filters?: { search?: string; universityId?: number; topic?: string; course?: string; availableForVoice?: boolean; limit?: number }, signal?: AbortSignal): Promise<{ items: ConversationCompanion[] }> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.universityId) params.set("universityId", String(filters.universityId));
  if (filters?.topic) params.set("topic", filters.topic);
  if (filters?.course) params.set("course", filters.course);
  if (filters?.availableForVoice !== undefined) params.set("availableForVoice", String(filters.availableForVoice));
  if (filters?.limit) params.set("limit", String(filters.limit));
  const q = params.toString();
  return apiRequest<{ items: ConversationCompanion[] }>(`/conversation-companions${q ? `?${q}` : ""}`, { signal });
}

export async function fetchMyCompanionProfile(): Promise<unknown> {
  return apiRequest<unknown>("/conversation-companions/me");
}

export async function upsertMyCompanionProfile(payload: { description?: string; topics?: string[]; courses?: string[]; availabilityText?: string; availableForVoice?: boolean; isActive?: boolean }): Promise<unknown> {
  return apiRequest<unknown>("/conversation-companions/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteMyCompanionProfile(): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>("/conversation-companions/me", { method: "DELETE" });
}

export function getMaterialUrl(fileUrl: string): string {
  if (fileUrl.startsWith("http")) return fileUrl;
  return buildApiUrl(fileUrl);
}
