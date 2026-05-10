import type { Community, CreatePostImagePayload, FeedPost } from "@crunedu/shared";

export type PostType = "publicacion" | "apunte" | "pregunta" | "momento" | "debate" | "tramite";

export type LocalAttachmentFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  file?: File;
};

export type LocalFeedPost = {
  id: string;
  type: PostType;
  title?: string;
  content: string;
  authorName: string;
  authorAvatarUrl?: string;
  communityName?: string;
  createdAt: string;
  tags: string[];
  courseName?: string;
  stance?: string;
  deadline?: string;
  images?: Array<{ id: string; url: string; alt?: string }>;
  files?: LocalAttachmentFile[];
  stats: { likes: number; comments: number; saves: number };
  viewerState: { liked: boolean; saved: boolean };
  commentsPreview?: Array<{ id: string; authorName: string; content: string; createdAt: string }>;
};

export type PostDraft = {
  id: string;
  type: PostType;
  title: string;
  content: string;
  courseName?: string;
  stance?: string;
  deadline?: string;
  visibility: "todos" | "comunidad";
  communityId?: string;
  tags: string[];
  createdAt: string;
};

export interface CreatePostSubmitPayload {
  type: PostType;
  title: string;
  content: string;
  courseName?: string;
  stance?: string;
  deadline?: string;
  visibility: "todos" | "comunidad";
  communityId: string;
  tags: string[];
  attachedFiles: LocalAttachmentFile[];
  attachedImages: Array<{ id: string; url: string; uploaded?: CreatePostImagePayload }>;
}

export interface FeedPostCard extends Omit<FeedPost, "id"> {
  id: string | number;
}

export type CommunityLite = Pick<Community, "id" | "name">;
