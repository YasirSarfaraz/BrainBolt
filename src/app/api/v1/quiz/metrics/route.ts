import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateAccuracy, generateDifficultyHistogram } from '@/lib/scoring';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Get user state
        const userState = await prisma.userState.findUnique({
            where: { userId },
        });

        if (!userState) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get recent answer logs for histogram and performance window
        const recentLogs = await prisma.answerLog.findMany({
            where: { userId },
            orderBy: { answeredAt: 'desc' },
            take: 50,
            select: {
                difficulty: true,
                correct: true,
                scoreDelta: true,
                streakAtAnswer: true,
                answeredAt: true,
            },
        });

        // Calculate metrics
        const accuracy = calculateAccuracy(userState.totalCorrect, userState.totalAnswered);
        const histogram = generateDifficultyHistogram(recentLogs);

        // Recent performance window (last 10 answers)
        const recentPerformance = recentLogs.slice(0, 10).map((log) => ({
            difficulty: log.difficulty,
            correct: log.correct,
            scoreDelta: log.scoreDelta,
            streakAtAnswer: log.streakAtAnswer,
            answeredAt: log.answeredAt,
        }));

        return NextResponse.json({
            currentDifficulty: userState.currentDifficulty,
            streak: userState.streak,
            maxStreak: userState.maxStreak,
            totalScore: userState.totalScore,
            totalAnswered: userState.totalAnswered,
            totalCorrect: userState.totalCorrect,
            accuracy,
            momentum: userState.momentum,
            difficultyHistogram: histogram,
            recentPerformance,
            lastAnswerAt: userState.lastAnswerAt,
        });
    } catch (error) {
        console.error('Metrics error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
