import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
    redis: Redis | undefined;
};

function createRedisClient(): Redis {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';

    const client = new Redis(url, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            const delay = Math.min(times * 200, 2000);
            return delay;
        },
        lazyConnect: true,
    });

    client.on('error', (err) => {
        console.error('Redis connection error:', err.message);
    });

    client.on('connect', () => {
        console.log('Redis connected');
    });

    return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

// ============================================================
// Cache Keys & Helpers
// ============================================================

export const CacheKeys = {
    userState: (userId: string) => `user:state:${userId}`,
    questionPool: (difficulty: number) => `questions:pool:${difficulty}`,
    leaderboardScore: () => 'leaderboard:score',
    leaderboardStreak: () => 'leaderboard:streak',
    rateLimitKey: (userId: string) => `ratelimit:${userId}`,
    idempotencyKey: (key: string) => `idempotency:${key}`,
};

export const CacheTTL = {
    userState: 300,        // 5 minutes
    questionPool: 600,     // 10 minutes
    leaderboard: 10,       // 10 seconds for near-real-time
    idempotency: 3600,     // 1 hour
};

// Generic cache get/set helpers
export async function cacheGet<T>(key: string): Promise<T | null> {
    try {
        const data = await redis.get(key);
        if (!data) return null;
        return JSON.parse(data) as T;
    } catch {
        return null;
    }
}

export async function cacheSet(key: string, data: unknown, ttl: number): Promise<void> {
    try {
        await redis.set(key, JSON.stringify(data), 'EX', ttl);
    } catch (err) {
        console.error('Cache set error:', err);
    }
}

export async function cacheDel(key: string): Promise<void> {
    try {
        await redis.del(key);
    } catch (err) {
        console.error('Cache delete error:', err);
    }
}
