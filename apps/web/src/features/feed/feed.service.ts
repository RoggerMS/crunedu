import { apiFeedRepository } from "./api-feed.repository";
import { localFeedRepository } from "./local-feed.repository";

export const getFeedRepository = () => (process.env.NEXT_PUBLIC_FEED_SOURCE === "api" ? apiFeedRepository : localFeedRepository);
