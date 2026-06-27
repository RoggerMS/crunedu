export type MomentView = "moments" | "news" | "gallery" | "saved" | "trends";
export type MomentType = "now" | "alert" | "food" | "humor" | "event" | "campus" | "community" | "lost_found";
export type MomentStatus = "active" | "expiring" | "expired" | "reported" | "grouped";

export type MomentMedia = { id: string; type: "image" | "video"; url: string; thumbnailUrl?: string; alt?: string; durationSeconds?: number };
export type MomentItem = {
  id: string; title: string; description?: string; type: MomentType; location?: string; createdAt: string; expiresAt: string | null; isPermanent?: boolean; inFeed?: boolean; tags: string[]; media: MomentMedia[];
  author: { id: string; name: string; avatarUrl?: string };
  stats: { likes: number; confirmations: number; comments: number; shares: number; views: number };
  viewerState: { liked: boolean; saved: boolean; confirmed: boolean };
  status: MomentStatus;
  isMine?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
};

export type MomentNewsSummary = {
  id: string; title: string; summary: string; tags: string[]; status: "active" | "in_progress" | "resolved"; relatedMomentIds: string[]; updatedAt: string; createdAt: string;
  stats: { likes: number; confirmations: number; comments: number; photos: number }; coverImageUrl?: string;
};

export type MomentComment = { id: string; momentId: string; author: string; authorAvatarUrl?: string; content: string; createdAt: string; isMine?: boolean };

export type MomentTrend = { position: number; tag: string; moments: number; likes: number; growth: number };

export type MomentTopic = { tag: string; count: number };
