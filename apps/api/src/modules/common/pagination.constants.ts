export const PAGINATION_LIMITS = {
  postsFeed: { default: 10, max: 30 },
  communityPosts: { default: 10, max: 50 },
  reportsQueue: { default: 20, max: 100 },
  search: { default: 5, max: 20 },
} as const;
