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
};

export type SharedEntity = {
  id: string;
  type: "note" | "question" | "debate" | "community" | "university" | "store_listing" | "profile" | "moment";
  title: string;
  description?: string;
  href: string;
  meta?: string;
  imageUrl?: string;
};

export type FeedPost = {
  id: string;
  type: FeedPostType;
  author: { id: string; name: string; avatarUrl?: string };
  content: string;
  destination: { type: "general" | "community"; id?: string | number; label: string };
  visibility: "public" | "community" | "private";
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
  author: { id: string; name: string; avatarUrl?: string };
  content: string;
  createdAt: string;
  stats?: { likes: number; replies: number };
  viewerState?: { liked: boolean };
};

export type CreateFeedPostInput = {
  content: string;
  attachments?: FeedAttachment[];
  destination?: FeedPost["destination"];
  visibility?: FeedPost["visibility"];
};
