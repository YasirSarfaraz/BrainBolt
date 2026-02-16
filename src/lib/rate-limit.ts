import { redis, CacheKeys } from './redis';

/**
 * Simple token-bucket rate limiter using Redis
 * Allows MAX_REQUESTS per WINDOW_SECONDS per user
 */

const MAX_REQUESTS = 30;
const WINDOW_SECONDS = 60;

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
}

export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
    const key = CacheKeys.rateLimitKey(userId);
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - WINDOW_SECONDS;

    try {
        // Use sorted set with timestamps as scores
        const pipe = redis.pipeline();

        // Remove old entries
        pipe.zremrangebyscore(key, '-inf', windowStart);

        // Count current entries
        pipe.zcard(key);

        // Add current request
        pipe.zadd(key, now, `${now}:${Math.random()}`);

        // Set expiry on the key
        pipe.expire(key, WINDOW_SECONDS);

        const results = await pipe.exec();

        if (!results) {
            return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_SECONDS };
        }

        const currentCount = (results[1]?.[1] as number) || 0;
        const allowed = currentCount < MAX_REQUESTS;
        const remaining = Math.max(0, MAX_REQUESTS - currentCount - 1);

        return {
            allowed,
            remaining,
            resetAt: now + WINDOW_SECONDS,
        };
    } catch {
        // If Redis fails, allow the request (fail open)
        return { allowed: true, remaining: MAX_REQUESTS, resetAt: now + WINDOW_SECONDS };
    }
}
