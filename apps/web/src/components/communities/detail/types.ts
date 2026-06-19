export type CommunityDetailModel = {
  id: number;
  name: string;
  description: string;
  rules: string[];
  avatarUrl?: string | null;
  coverUrl?: string | null;
  membersCount: number;
  postsCount: number;
  createdAt?: string;
  visibilityLabel: string;
  creatorName?: string;
  creatorAvatarUrl?: string | null;
  isPrivate?: boolean;
  members?: Array<{ id: number; name: string; avatarUrl?: string | null; isCreator?: boolean }>;
};

export type CommunityMediaItem = {
  id: string;
  postId: number;
  imageUrl: string;
  alt: string;
  authorName?: string;
  createdAt?: string;
};

export type CommunityFileItem = {
  id: string;
  name: string;
  source: "question" | "note" | "post";
  createdAt?: string;
  href?: string;
};

export type CommunityPostModel = {
  id: number;
  title?: string;
  content: string;
  createdAt?: string;
  authorId?: number;
  authorName?: string;
  authorAvatarUrl?: string | null;
  likes: number;
  commentsCount: number;
  saves: number;
  liked: boolean;
  saved: boolean;
  isMine: boolean;
  images?: Array<{ id: number | string; imageUrl: string; mimeType?: string; sizeBytes?: number }>;
};

export type ToastFn = (message: string, type?: "success" | "error" | "info") => void;
