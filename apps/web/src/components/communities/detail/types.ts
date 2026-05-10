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
  category?: string;
  creatorName?: string;
};

export type ToastFn = (message: string, type?: "success" | "error" | "info") => void;
