import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const limiters = new Map<string, Ratelimit>();

function getLimiter(key: string, requests: number, window: string): Ratelimit | null {
  const cacheKey = `${key}:${requests}:${window}`;
  const existing = limiters.get(cacheKey);
  if (existing) return existing;

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (process.env.NODE_ENV === "production") return null;
    return null;
  }

  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix: `saver:${key}`,
  });
  limiters.set(cacheKey, limiter);
  return limiter;
}

export async function enforceRateLimit(id: string, requests = 10, window = "1 m"): Promise<boolean> {
  const limiter = getLimiter("default", requests, window);
  if (!limiter) {
    if (process.env.NODE_ENV === "production") throw new Error("RATE_LIMIT_NOT_CONFIGURED");
    return true;
  }
  return (await limiter.limit(id)).success;
}
