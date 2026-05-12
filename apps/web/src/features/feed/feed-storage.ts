import type { FeedComment, FeedPost } from "./feed.types";

export const FEED_STORAGE_KEYS = {
  posts: "crunedu_feed_posts",
  comments: "crunedu_feed_comments",
  hidden: "crunedu_feed_hidden",
  reports: "crunedu_feed_reports",
  events: "crunedu_feed_events",
} as const;

const safeParse = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const loadPosts = () => safeParse<unknown[]>(FEED_STORAGE_KEYS.posts, []);
export const savePosts = (posts: FeedPost[]) => localStorage.setItem(FEED_STORAGE_KEYS.posts, JSON.stringify(posts));
export const loadComments = () => safeParse<Record<string, FeedComment[]>>(FEED_STORAGE_KEYS.comments, {});
export const saveComments = (comments: Record<string, FeedComment[]>) => localStorage.setItem(FEED_STORAGE_KEYS.comments, JSON.stringify(comments));
export const loadHidden = () => safeParse<string[]>(FEED_STORAGE_KEYS.hidden, []);
export const saveHidden = (hidden: string[]) => localStorage.setItem(FEED_STORAGE_KEYS.hidden, JSON.stringify(hidden));
export const loadReports = () => safeParse<Array<Record<string, unknown>>>(FEED_STORAGE_KEYS.reports, []);
export const saveReports = (reports: Array<Record<string, unknown>>) => localStorage.setItem(FEED_STORAGE_KEYS.reports, JSON.stringify(reports));
export const appendEvent = (event: Record<string, unknown>) => {
  const events = safeParse<Record<string, unknown>[]>(FEED_STORAGE_KEYS.events, []);
  localStorage.setItem(FEED_STORAGE_KEYS.events, JSON.stringify([event, ...events].slice(0, 200)));
};
