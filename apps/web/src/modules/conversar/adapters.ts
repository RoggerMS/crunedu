import type {
  ConversationDetail,
  ConversationListItem,
  ConversationCompanion,
  ConversationRecordingItem,
  ConversationDebateStance,
} from "@crunedu/shared";
import type {
  Conversation,
  ConversationParticipant,
  ConversationRecording,
  Companion,
  DebateStance,
  ConversarUser,
} from "./types";

function mapStatus(status: string): Conversation["status"] {
  if (status === "LIVE") return "live";
  if (status === "WAITING") return "waiting";
  if (status === "ENDED") return "finished";
  if (status === "CANCELLED") return "finished";
  if (status === "DRAFT") return "waiting";
  return "finished";
}

function mapType(type: string): Conversation["type"] {
  return (type.toLowerCase() as Conversation["type"]) ?? "open";
}

function mapVisibility(visibility: string): Conversation["visibility"] {
  return (visibility.toLowerCase() as Conversation["visibility"]) ?? "public";
}

function mapUser(author: { id: number; name: string; avatarUrl: string | null }): ConversarUser {
  return {
    id: String(author.id),
    name: author.name,
    avatarUrl: author.avatarUrl ?? undefined,
  };
}

export function adaptConversation(item: ConversationListItem): Conversation {
  return {
    id: String(item.id),
    type: mapType(item.type),
    status: mapStatus(item.status),
    title: item.title,
    description: item.description,
    category: item.category,
    course: item.course ?? undefined,
    createdBy: mapUser(item.createdBy),
    createdAt: item.createdAt,
    visibility: mapVisibility(item.visibility),
    isRecording: item.isRecording,
    recording: null,
    participants: [],
    talkingCount: item.speakersCount,
    listeningCount: item.listenersCount,
    tags: item.tags,
    materials: item.materials.map((m) => ({
      id: String(m.id),
      title: m.title,
      type: (m.type.toLowerCase() as "pdf" | "docx" | "pptx" | "image" | "link" | "other") ?? "other",
      size: `${Math.round(m.sizeBytes / 1024)} KB`,
      url: m.fileUrl,
      uploadedBy: { id: String(m.uploadedById), name: "" },
      uploadedAt: m.createdAt,
    })),
    sharedLinks: item.links.map((l) => ({
      id: String(l.id),
      title: l.title,
      url: l.url,
      type: (l.type.toLowerCase() as "meet" | "zoom" | "discord" | "teams" | "document" | "video" | "other") ?? "other",
      domain: l.domain,
      sharedBy: { id: String(l.sharedById), name: "" },
      sharedAt: l.createdAt,
    })),
  };
}

export function adaptConversationDetail(item: ConversationDetail): Conversation {
  const base = adaptConversation(item);
  return {
    ...base,
    rules: item.rules ?? undefined,
    debateStances: item.debateStances?.map((s): DebateStance => ({
      id: String(s.id),
      title: s.title,
      description: s.description ?? undefined,
      participants: s.participants,
      arguments: [],
    })),
  };
}

export function adaptRecording(item: ConversationRecordingItem): ConversationRecording {
  return {
    id: String(item.id),
    status: item.status === "AVAILABLE" ? "available" : item.status === "PROCESSING" ? "processing" : "restricted",
    durationLabel: item.durationSeconds > 0 ? `${Math.floor(item.durationSeconds / 60)} min` : "—",
    audioUrl: item.fileUrl ?? undefined,
    plays: item.plays,
    createdAt: item.createdAt,
  };
}

export function adaptCompanion(item: ConversationCompanion): Companion {
  return {
    id: `comp-${item.userId}`,
    user: {
      id: String(item.user.id),
      name: item.user.name,
      avatarUrl: item.user.avatarUrl ?? undefined,
      university: item.user.university?.name,
      career: item.user.career?.name,
    },
    topics: item.topics,
    availability: item.availabilityText ?? "",
    description: item.description,
    canVoice: item.availableForVoice,
  };
}

export function adaptStance(item: ConversationDebateStance): DebateStance {
  return {
    id: String(item.id),
    title: item.title,
    description: item.description ?? undefined,
    participants: item.participants,
    arguments: item.arguments.map((a) => ({
      id: String(a.id),
      stanceId: String(item.id),
      content: a.content,
      author: mapUser(a.author),
      createdAt: a.createdAt,
    })),
  };
}
