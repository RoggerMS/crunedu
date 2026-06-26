import type { MomentType } from "@prisma/client";

export type MomentMediaRow = {
  id: number;
  imageUrl: string;
  mimeType: string;
  sizeBytes: number;
  position: number;
};

export type MomentAuthorRow = {
  id: number;
  email: string;
  profile: { firstName: string | null; lastName: string | null; avatarUrl: string | null } | null;
};

export type MomentRow = {
  id: number;
  title: string;
  description: string | null;
  type: MomentType;
  location: string | null;
  status: string;
  expiresAt: Date;
  shareCount: number;
  viewCount: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  user: MomentAuthorRow;
  media: MomentMediaRow[];
  tags: { tag: { name: string; slug: string } }[];
  _count: { boosts: number; confirmations: number; comments: number; savedBy: number };
};

export type MomentViewerState = {
  boosted: boolean;
  saved: boolean;
  confirmed: boolean;
};

export type MomentResponseDto = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  location: string | null;
  createdAt: string;
  expiresAt: string;
  tags: string[];
  media: { id: string; type: "image" | "video"; url: string; alt: string | null }[];
  author: { id: string; name: string; avatarUrl: string | null };
  stats: { boosts: number; confirmations: number; comments: number; shares: number; views: number };
  viewerState: MomentViewerState;
  status: "active" | "expiring" | "expired";
  isMine: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export type MomentCommentRow = {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  user: MomentAuthorRow;
};

export type MomentCommentResponseDto = {
  id: string;
  momentId: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
  isMine: boolean;
};

export type MomentNewsSummaryDto = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  status: "active" | "in_progress" | "resolved";
  relatedMomentIds: string[];
  updatedAt: string;
  stats: { boosts: number; confirmations: number; comments: number; photos: number };
  coverImageUrl: string | null;
};

export type MomentTrendDto = {
  position: number;
  tag: string;
  moments: number;
  boosts: number;
  growth: number;
};

export type MomentTopicDto = {
  tag: string;
  count: number;
};

const EXPIRING_WINDOW_MS = 6 * 3600_000;

function authorName(author: MomentAuthorRow): string {
  const first = author.profile?.firstName ?? "";
  const last = author.profile?.lastName ?? "";
  const name = `${first} ${last}`.trim();
  return name || "Estudiante CrunEdu";
}

function mediaType(mimeType: string): "image" | "video" {
  return mimeType.startsWith("video/") ? "video" : "image";
}

export function computeMomentStatus(expiresAt: Date, now: number): "active" | "expiring" | "expired" {
  const expiresMs = expiresAt.getTime();
  if (expiresMs <= now) return "expired";
  if (expiresMs - now <= EXPIRING_WINDOW_MS) return "expiring";
  return "active";
}

export function mapMoment(
  row: MomentRow,
  viewer?: { userId: number; boosted: boolean; saved: boolean; confirmed: boolean } | null,
): MomentResponseDto {
  const now = Date.now();
  const isMine = viewer != null && row.userId === viewer.userId;
  const canEdit = isMine;
  const canDelete = isMine;
  return {
    id: String(row.id),
    title: row.title,
    description: row.description,
    type: row.type.toLowerCase(),
    location: row.location,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    tags: row.tags.map((t) => t.tag.name),
    media: row.media.map((m) => ({
      id: String(m.id),
      type: mediaType(m.mimeType),
      url: m.imageUrl,
      alt: null,
    })),
    author: {
      id: String(row.user.id),
      name: authorName(row.user),
      avatarUrl: row.user.profile?.avatarUrl ?? null,
    },
    stats: {
      boosts: row._count.boosts,
      confirmations: row._count.confirmations,
      comments: row._count.comments,
      shares: Math.max(0, row.shareCount),
      views: Math.max(0, row.viewCount),
    },
    viewerState: {
      boosted: viewer?.boosted ?? false,
      saved: viewer?.saved ?? false,
      confirmed: viewer?.confirmed ?? false,
    },
    status: computeMomentStatus(row.expiresAt, now),
    isMine,
    canEdit,
    canDelete,
  };
}

export function mapComment(row: MomentCommentRow, viewerUserId?: number): MomentCommentResponseDto {
  return {
    id: String(row.id),
    momentId: "",
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    author: {
      id: String(row.user.id),
      name: authorName(row.user),
      avatarUrl: row.user.profile?.avatarUrl ?? null,
    },
    isMine: viewerUserId != null && row.userId === viewerUserId,
  };
}

export function slugifyTag(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}
