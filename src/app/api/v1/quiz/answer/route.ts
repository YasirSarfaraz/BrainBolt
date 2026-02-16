import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { cacheDel, cacheGet, cacheSet, CacheKeys, CacheTTL } from '@/lib/redis';
import { computeNextState } from '@/lib/adaptive';
import { calculateScoreDelta } from '@/lib/scoring';
import { generateFeedback, generateExplanation } from '@/lib/gemini';

interface IdempotencyCache {
    correct: boolean;
    newDifficulty: number;
    newStreak: number;
    scoreDelta: number;
    totalScore: number;
    stateVersion: number;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, sessionId, questionId, answer, stateVersion, answerIdempotencyKey } = body;

        // Validate required fields
        if (!userId || !questionId || answer === undefined || answer === null || !answerIdempotencyKey) {
            return NextResponse.json(
                { error: 'Missing required fields: userId, questionId, answer, answerIdempotencyKey' },
                { status: 400 }
            );
        }

        // Rate limiting
        const rateLimit = await checkRateLimit(userId);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', resetAt: rateLimit.resetAt },
                { status: 429 }
            );
        }

        // ---- Idempotency Check ----
        // Check Redis cache first for fast path
        const idempotencyCacheKey = CacheKeys.idempotencyKey(answerIdempotencyKey);
        const cachedResult = await cacheGet<IdempotencyCache>(idempotencyCacheKey);
        if (cachedResult) {
            // Return cached result  —  duplicate submission
            const leaderboardRanks = await getLeaderboardRanks(userId);
            return NextResponse.json({
                correct: cachedResult.correct,
                newDifficulty: cachedResult.newDifficulty,
                newStreak: cachedResult.newStreak,
                scoreDelta: cachedResult.scoreDelta,
                totalScore: cachedResult.totalScore,
                stateVersion: cachedResult.stateVersion,
                duplicate: true,
                ...leaderboardRanks,
            });
        }

        // Also check DB for idempotency (in case Redis was cleared)
        const existingAnswer = await prisma.answerLog.findUnique({
            where: { idempotencyKey: answerIdempotencyKey },
        });
        if (existingAnswer) {
            const userState = await prisma.userState.findUnique({ where: { userId } });
            const leaderboardRanks = await getLeaderboardRanks(userId);
            return NextResponse.json({
                correct: existingAnswer.correct,
                newDifficulty: userState?.currentDifficulty ?? 1,
                newStreak: userState?.streak ?? 0,
                scoreDelta: existingAnswer.scoreDelta,
                totalScore: userState?.totalScore ?? 0,
                stateVersion: userState?.stateVersion ?? 1,
                duplicate: true,
                ...leaderboardRanks,
            });
        }

        // ---- Get question and verify answer ----
        const question = await prisma.question.findUnique({
            where: { id: questionId },
        });

        if (!question) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        const isCorrect = answer === question.correctIndex;

        // ---- Get current user state ----
        const userState = await prisma.userState.findUnique({
            where: { userId },
        });

        if (!userState) {
            return NextResponse.json({ error: 'User state not found' }, { status: 404 });
        }

        // ---- Optimistic locking check ----
        if (stateVersion && stateVersion !== userState.stateVersion) {
            return NextResponse.json(
                { error: 'State version conflict. Please refresh and try again.', staleVersion: true },
                { status: 409 }
            );
        }

        // ---- Compute adaptive state changes ----
        const now = new Date();
        const adaptiveResult = computeNextState(
            {
                currentDifficulty: userState.currentDifficulty,
                momentum: userState.momentum,
                streak: userState.streak,
                maxStreak: userState.maxStreak,
                recentAnswers: userState.recentAnswers,
                lastAnswerAt: userState.lastAnswerAt,
            },
            isCorrect,
            now
        );

        // ---- Calculate score ----
        // Use the NEW streak (after increment) for score calculation
        const scoreDelta = calculateScoreDelta(
            question.difficulty,
            adaptiveResult.newStreak,
            isCorrect
        );
        const newTotalScore = userState.totalScore + scoreDelta;

        // ---- Update everything in a transaction ----
        const newStateVersion = userState.stateVersion + 1;

        await prisma.$transaction([
            // Update user state
            prisma.userState.update({
                where: { userId },
                data: {
                    currentDifficulty: adaptiveResult.newDifficulty,
                    streak: adaptiveResult.newStreak,
                    maxStreak: adaptiveResult.newMaxStreak,
                    totalScore: newTotalScore,
                    totalAnswered: { increment: 1 },
                    totalCorrect: isCorrect ? { increment: 1 } : undefined,
                    momentum: adaptiveResult.newMomentum,
                    recentAnswers: adaptiveResult.newRecentAnswers,
                    lastQuestionId: questionId,
                    lastAnswerAt: now,
                    stateVersion: newStateVersion,
                },
            }),

            // Create answer log
            prisma.answerLog.create({
                data: {
                    userId,
                    questionId,
                    difficulty: question.difficulty,
                    answer,
                    correct: isCorrect,
                    scoreDelta,
                    streakAtAnswer: adaptiveResult.newStreak,
                    idempotencyKey: answerIdempotencyKey,
                    answeredAt: now,
                },
            }),

            // Update leaderboard score
            prisma.leaderboardScore.upsert({
                where: { userId },
                update: { totalScore: newTotalScore },
                create: {
                    userId,
                    totalScore: newTotalScore,
                    username: '',
                },
            }),

            // Update leaderboard streak
            prisma.leaderboardStreak.upsert({
                where: { userId },
                update: { maxStreak: adaptiveResult.newMaxStreak },
                create: {
                    userId,
                    maxStreak: adaptiveResult.newMaxStreak,
                    username: '',
                },
            }),
        ]);

        // ---- Cache idempotency result ----
        const result: IdempotencyCache = {
            correct: isCorrect,
            newDifficulty: adaptiveResult.newDifficulty,
            newStreak: adaptiveResult.newStreak,
            scoreDelta,
            totalScore: newTotalScore,
            stateVersion: newStateVersion,
        };
        await cacheSet(idempotencyCacheKey, result, CacheTTL.idempotency);

        // ---- Invalidate user state cache ----
        await cacheDel(CacheKeys.userState(userId));
        await cacheDel(CacheKeys.leaderboardScore());
        await cacheDel(CacheKeys.leaderboardStreak());

        // ---- Get leaderboard ranks ----
        const leaderboardRanks = await getLeaderboardRanks(userId);

        // ---- Generate AI Feedback & Explanation ----
        const feedbackPromise = generateFeedback(
            isCorrect,
            adaptiveResult.newStreak,
            question.difficulty,
            question.prompt
        );

        const explanationPromise = isCorrect
            ? null
            : generateExplanation(
                question.prompt,
                question.choices[question.correctIndex],
                question.choices[answer],
                false
            );

        const [aiFeedback, aiExplanation] = await Promise.all([
            feedbackPromise,
            explanationPromise,
        ]);

        return NextResponse.json({
            correct: isCorrect,
            correctAnswer: question.correctIndex,
            newDifficulty: adaptiveResult.newDifficulty,
            newStreak: adaptiveResult.newStreak,
            maxStreak: adaptiveResult.newMaxStreak,
            scoreDelta,
            totalScore: newTotalScore,
            momentum: adaptiveResult.newMomentum,
            stateVersion: newStateVersion,
            streakReset: adaptiveResult.streakReset,
            inactivityDecay: adaptiveResult.inactivityDecay,
            aiFeedback,
            aiExplanation,
            ...leaderboardRanks,
        });
    } catch (error) {
        console.error('Quiz answer error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function getLeaderboardRanks(userId: string) {
    try {
        // Get user's score rank
        const scoreRank = await prisma.$queryRaw<[{ rank: bigint }]>`
      SELECT COUNT(*) + 1 as rank
      FROM leaderboard_score
      WHERE total_score > (
        SELECT total_score FROM leaderboard_score WHERE user_id = ${userId}
      )
    `;

        // Get user's streak rank
        const streakRank = await prisma.$queryRaw<[{ rank: bigint }]>`
      SELECT COUNT(*) + 1 as rank
      FROM leaderboard_streak
      WHERE max_streak > (
        SELECT max_streak FROM leaderboard_streak WHERE user_id = ${userId}
      )
    `;

        return {
            leaderboardRankScore: Number(scoreRank[0]?.rank ?? 0),
            leaderboardRankStreak: Number(streakRank[0]?.rank ?? 0),
        };
    } catch {
        return {
            leaderboardRankScore: 0,
            leaderboardRankStreak: 0,
        };
    }
}
