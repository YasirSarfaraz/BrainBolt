import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from '@/lib/redis';

interface LeaderboardEntry {
    userId: string;
    username: string;
    maxStreak: number;
    rank: number;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const userId = searchParams.get('userId');

        // Try cache first
        const cacheKey = CacheKeys.leaderboardStreak();
        let leaderboard = await cacheGet<LeaderboardEntry[]>(cacheKey);

        if (!leaderboard) {
            const entries = await prisma.leaderboardStreak.findMany({
                orderBy: { maxStreak: 'desc' },
                take: limit,
                include: {
                    user: {
                        select: { username: true },
                    },
                },
            });

            leaderboard = entries.map((entry, index) => ({
                userId: entry.userId,
                username: entry.user.username,
                maxStreak: entry.maxStreak,
                rank: index + 1,
            }));

            await cacheSet(cacheKey, leaderboard, CacheTTL.leaderboard);
        }

        // If userId provided, get their rank
        let userRank: LeaderboardEntry | null = null;
        if (userId) {
            const existingEntry = leaderboard.find((e) => e.userId === userId);
            if (existingEntry) {
                userRank = existingEntry;
            } else {
                const userStreak = await prisma.leaderboardStreak.findUnique({
                    where: { userId },
                    include: { user: { select: { username: true } } },
                });

                if (userStreak) {
                    const rank = await prisma.leaderboardStreak.count({
                        where: { maxStreak: { gt: userStreak.maxStreak } },
                    });

                    userRank = {
                        userId,
                        username: userStreak.user.username,
                        maxStreak: userStreak.maxStreak,
                        rank: rank + 1,
                    };
                }
            }
        }

        return NextResponse.json({
            leaderboard,
            userRank,
            total: leaderboard.length,
        });
    } catch (error) {
        console.error('Leaderboard streak error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
