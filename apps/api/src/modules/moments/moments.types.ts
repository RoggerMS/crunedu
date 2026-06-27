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

export type MomentPostRow = {
  id: number;
  content: string;
  viewCount: number;
  shareCount: number;
  inFeed: boolean;
  images: MomentMediaRow[];
  _count: { reactions: number; comments: number; savedBy: number };
};

export type MomentRow = {
  id: number;
  title: string;
  description: string | null;
  type: MomentType;
  location: string | null;
  status: string;
  isPermanent: boolean;
  expiresAt: Date | null;
  shareCount: number;
  viewCount: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  postId: number | null;
  user: MomentAuthorRow;
  post: MomentPostRow | null;
  tags: { tag: { name: string; slug: string } }[];
  _count: { confirmations: number };
};

export type MomentViewerState = {
  liked: boolean;
  saved: boolean;
  confirmed: boolean;
};

export type MomentResponseDto = {
  id: string;
  postId: string | null;
  title: string;
  description: string | null;
  type: string;
  location: string | null;
  createdAt: string;
  expiresAt: string | null;
  isPermanent: boolean;
  inFeed: boolean;
  tags: string[];
  media: { id: string; type: "image" | "video"; url: string; alt: string | null }[];
  author: { id: string; name: string; avatarUrl: string | null };
  stats: { likes: number; confirmations: number; comments: number; shares: number; views: number };
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
  createdAt: string;
  stats: { likes: number; confirmations: number; comments: number; photos: number };
  coverImageUrl: string | null;
};

export type MomentNewsDetailDto = MomentNewsSummaryDto & {
  relatedMoments: MomentResponseDto[];
};

export type MomentTrendDto = {
  position: number;
  tag: string;
  moments: number;
  likes: number;
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

export function computeMomentStatus(expiresAt: Date | null, isPermanent: boolean, now: number): "active" | "expiring" | "expired" {
  if (isPermanent || expiresAt === null) return "active";
  const expiresMs = expiresAt.getTime();
  if (expiresMs <= now) return "expired";
  if (expiresMs - now <= EXPIRING_WINDOW_MS) return "expiring";
  return "active";
}

export function mapMoment(
  row: MomentRow,
  viewer?: { userId: number; liked: boolean; saved: boolean; confirmed: boolean } | null,
): MomentResponseDto {
  const now = Date.now();
  const isMine = viewer != null && row.userId === viewer.userId;
  const canEdit = isMine;
  const canDelete = isMine;
  const post = row.post;
  const media = post?.images ?? [];
  return {
    id: String(row.id),
    postId: row.postId != null ? String(row.postId) : null,
    title: row.title,
    description: row.description,
    type: row.type.toLowerCase(),
    location: row.location,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    isPermanent: row.isPermanent,
    inFeed: post?.inFeed ?? false,
    tags: row.tags.map((t) => t.tag.name),
    media: media.map((m) => ({
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
      likes: post?._count.reactions ?? 0,
      confirmations: row._count.confirmations,
      comments: post?._count.comments ?? 0,
      shares: Math.max(0, post?.shareCount ?? row.shareCount),
      views: Math.max(0, post?.viewCount ?? row.viewCount),
    },
    viewerState: {
      liked: viewer?.liked ?? false,
      saved: viewer?.saved ?? false,
      confirmed: viewer?.confirmed ?? false,
    },
    status: computeMomentStatus(row.expiresAt, row.isPermanent, now),
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
