export type FeedPostType =
  | "text"
  | "image"
  | "shared_note"
  | "shared_question"
  | "shared_debate"
  | "shared_community"
  | "shared_university"
  | "shared_store_listing"
  | "shared_profile"
  | "shared_moment";

export type FeedAttachment = {
  id: string;
  type: "image";
  name: string;
  mimeType: string;
  size: number;
  previewUrl?: string;
  storageKey?: string;
  apiImageUrl?: string;
};

export type SharedEntity = {
  id: string;
  type: "note" | "question" | "debate" | "community" | "university" | "store_listing" | "profile" | "moment";
  title: string;
  description?: string;
  href: string;
  meta?: string;
  imageUrl?: string;
  fileType?: string;
  sizeBytes?: number;
};

export type FeedPost = {
  id: string;
  title?: string;
  type: FeedPostType;
  author: { id: string; name: string; avatarUrl?: string; username?: string | null; isVerified?: boolean };
  content: string;
  destination: { type: "general" | "community"; id?: string | number; label: string };
  visibility: "public" | "community" | "private";
  postVisibility?: "PUBLIC" | "FOLLOWERS" | "FRIENDS" | "ONLY_ME";
  inFeed?: boolean;
  attachments?: FeedAttachment[];
  sharedEntity?: SharedEntity;
  createdAt: string;
  updatedAt?: string;
  stats: { likes: number; comments: number; saves: number; shares: number };
  viewerState: { liked: boolean; saved: boolean; isMine?: boolean };
};

export type FeedComment = {
  id: string;
  postId: string;
  parentId?: string;
  author: { id: string; name: string; avatarUrl?: string; username?: string | null; isVerified?: boolean };
  content: string;
  createdAt: string;
  stats?: { likes: number; replies: number };
  viewerState?: { liked: boolean };
};

export type CreateFeedPostInput = {
  title?: string;
  content: string;
  communityId?: number | string;
  attachments?: FeedAttachment[];
  destination?: FeedPost["destination"];
  visibility?: FeedPost["visibility"];
};
