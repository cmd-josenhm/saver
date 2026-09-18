import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const cache = new Map<string, Ratelimit>();

function getLimiter(requests: number, window: string) {
  const key = requests + ":" + window;
  const cached = cache.get(key);
  if (cached) return cached;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix: "saver:" + key
  });
  cache.set(key, limiter);
  return limiter;
}

export async function enforceRateLimit(id: string, requests = 10, window = "1 m") {
  const limiter = getLimiter(requests, window);
  if (!limiter) {
    if (process.env.NODE_ENV === "production") throw new Error("RATE_LIMIT_NOT_CONFIGURED");
    return true;
  }
  return (await limiter.limit(id)).success;
}