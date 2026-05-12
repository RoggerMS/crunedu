import type { LocalFeedPost } from "@/components/feed/types";

export const FEED_STORAGE_KEYS = {
  posts: "crunedu_feed_posts",
  comments: "crunedu_feed_comments",
  state: "crunedu_feed_state",
  events: "crunedu_events",
  reports: "crunedu_feed_reports",
} as const;

export type FeedComment = { id: string; author: { id: "me"; name: "Tú" }; content: string; createdAt: string };
export type FeedCommentsByPost = Record<string, FeedComment[]>;
export type FeedState = { hiddenPostIds: string[] };

export function isQuotaExceededError(error: unknown) {
  return error instanceof DOMException && (error.name === "QuotaExceededError" || error.code === 22);
}

export function safeSetLocalStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return { ok: true as const };
  } catch (error) {
    if (isQuotaExceededError(error)) return { ok: false as const, quota: true as const };
    return { ok: false as const, quota: false as const };
  }
}

function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(key);
    throw new Error(`Corrupted:${key}`);
  }
}

export function loadFeedPosts() { return safeParse<LocalFeedPost[]>(FEED_STORAGE_KEYS.posts, []); }
export function saveFeedPosts(posts: LocalFeedPost[]) { return safeSetLocalStorage(FEED_STORAGE_KEYS.posts, posts); }
export function saveFeedPost(post: LocalFeedPost) { return saveFeedPosts([post, ...loadFeedPosts().filter((p) => p.id !== post.id)]); }
export function deleteFeedPost(id: string) { return saveFeedPosts(loadFeedPosts().filter((p) => p.id !== id)); }
export function loadFeedComments() { return safeParse<FeedCommentsByPost>(FEED_STORAGE_KEYS.comments, {}); }
export function saveFeedComments(comments: FeedCommentsByPost) { return safeSetLocalStorage(FEED_STORAGE_KEYS.comments, comments); }
export function loadFeedState() { return safeParse<FeedState>(FEED_STORAGE_KEYS.state, { hiddenPostIds: [] }); }
export function saveFeedState(state: FeedState) { return safeSetLocalStorage(FEED_STORAGE_KEYS.state, state); }
export function appendFeedEvent(event: Record<string, unknown>) {
  const current = safeParse<Record<string, unknown>[]>(FEED_STORAGE_KEYS.events, []);
  safeSetLocalStorage(FEED_STORAGE_KEYS.events, [event, ...current].slice(0, 200));
}
