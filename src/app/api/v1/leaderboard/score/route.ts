import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet, CacheKeys, CacheTTL } from '@/lib/redis';

interface LeaderboardEntry {
    userId: string;
    username: string;
    totalScore: number;
    rank: number;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const userId = searchParams.get('userId');

        // Try cache first
        const cacheKey = CacheKeys.leaderboardScore();
        let leaderboard = await cacheGet<LeaderboardEntry[]>(cacheKey);

        if (!leaderboard) {
            const entries = await prisma.leaderboardScore.findMany({
                orderBy: { totalScore: 'desc' },
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
                totalScore: entry.totalScore,
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
                // User not in top N, calculate their rank
                const userScore = await prisma.leaderboardScore.findUnique({
                    where: { userId },
                    include: { user: { select: { username: true } } },
                });

                if (userScore) {
                    const rank = await prisma.leaderboardScore.count({
                        where: { totalScore: { gt: userScore.totalScore } },
                    });

                    userRank = {
                        userId,
                        username: userScore.user.username,
                        totalScore: userScore.totalScore,
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
        console.error('Leaderboard score error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
