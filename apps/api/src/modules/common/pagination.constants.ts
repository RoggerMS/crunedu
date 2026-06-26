export const PAGINATION_LIMITS = {
  postsFeed: { default: 10, max: 30 },
  questions: { default: 10, max: 30 },
  communityPosts: { default: 10, max: 50 },
  marketplaceProducts: { default: 12, max: 40 },
  marketplaceFeaturedProducts: { default: 6, max: 12 },
  marketplaceInquiries: { default: 20, max: 50 },
  reportsQueue: { default: 20, max: 100 },
  search: { default: 5, max: 20 },
  momentsFeed: { default: 10, max: 30 },
  momentComments: { default: 20, max: 50 },
} as const;
