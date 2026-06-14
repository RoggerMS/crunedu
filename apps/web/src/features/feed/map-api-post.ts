import type { FeedPost as ApiFeedPost, PostComment as ApiPostComment } from "@crunedu/shared";
import { API_BASE_URL } from "@/lib/http-client";
import type { FeedAttachment, FeedComment, FeedPost } from "./feed.types";

type ApiFeedPostsResponse = {
  items?: ApiFeedPost[];
  nextCursor?: number | null;
  mode?: "recent" | "relevant";
};

function toIsoString(value: string | Date | null | undefined): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function formatAuthorName(author: ApiFeedPost["author"] | ApiPostComment["author"]): string {
  const fullName = [author.firstName, author.lastName].map((part) => part?.trim()).filter(Boolean).join(" ");
  return fullName || author.email || "Estudiante CrunEdu";
}

function resolveApiImageUrl(imageUrl: string): string {
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("data:") || imageUrl.startsWith("blob:")) return imageUrl;
  if (imageUrl.startsWith("/api/")) return `${new URL(API_BASE_URL).origin}${imageUrl}`;
  if (imageUrl.startsWith("/")) return `${API_BASE_URL}${imageUrl}`;
  return `${API_BASE_URL}/${imageUrl}`;
}

function mapApiImageToAttachment(image: ApiFeedPost["images"][number]): FeedAttachment {
  const imageUrl = resolveApiImageUrl(image.imageUrl);
  return {
    id: String(image.id),
    type: "image",
    name: `Imagen ${image.position + 1}`,
    mimeType: image.mimeType,
    size: image.sizeBytes,
    previewUrl: imageUrl,
    storageKey: image.imageUrl,
  };
}

export function mapApiPostToFeedPost(apiPost: ApiFeedPost): FeedPost {
  const community = apiPost.community;

  return {
    id: String(apiPost.id),
    type: "text",
    author: {
      id: String(apiPost.author.id),
      name: formatAuthorName(apiPost.author),
    },
    content: apiPost.content,
    destination: community
      ? { type: "community", id: community.id, label: community.name }
      : { type: "general", label: "Feed general" },
    visibility: community ? "community" : "public",
    attachments: (apiPost.images ?? []).map(mapApiImageToAttachment),
    createdAt: toIsoString(apiPost.createdAt),
    stats: {
      likes: 0,
      comments: apiPost.commentsCount ?? 0,
      saves: 0,
      shares: 0,
    },
    viewerState: {
      liked: false,
      saved: false,
    },
  };
}

export function mapApiPostsResponse(response: ApiFeedPostsResponse | ApiFeedPost[]): FeedPost[] {
  const items = Array.isArray(response) ? response : response.items ?? [];
  return items.map(mapApiPostToFeedPost);
}

export function mapApiCommentToFeedComment(apiComment: ApiPostComment, postId: string): FeedComment {
  return {
    id: String(apiComment.id),
    postId,
    author: {
      id: String(apiComment.author.id),
      name: formatAuthorName(apiComment.author),
    },
    content: apiComment.content,
    createdAt: toIsoString(apiComment.createdAt),
    stats: { likes: 0, replies: 0 },
    viewerState: { liked: false },
  };
}

export type { ApiFeedPostsResponse };
