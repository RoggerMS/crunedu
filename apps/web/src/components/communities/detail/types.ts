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

export type CommunityPostModel = {
  id: number;
  title?: string;
  content: string;
  createdAt?: string;
  authorName?: string;
  authorAvatarUrl?: string | null;
};

export type ToastFn = (message: string, type?: "success" | "error" | "info") => void;
