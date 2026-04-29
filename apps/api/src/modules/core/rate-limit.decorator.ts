import { SetMetadata } from "@nestjs/common";

export interface RateLimitOptions {
  windowMs: number;
  maxPerIp: number;
  maxPerUser?: number;
  message: string;
}

export const RATE_LIMIT_KEY = "rate_limit_options";

export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);
