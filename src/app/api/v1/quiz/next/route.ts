import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { getNextQuestion } from '@/lib/gemini';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const sessionId = searchParams.get('sessionId');

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Rate limiting
        const rateLimit = await checkRateLimit(userId);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', resetAt: rateLimit.resetAt },
                { status: 429 }
            );
        }

        // Get user state
        let userState = await prisma.userState.findUnique({
            where: { userId },
        });

        if (!userState) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check inactivity decay for streak
        if (userState.lastAnswerAt) {
            const elapsed = Date.now() - new Date(userState.lastAnswerAt).getTime();
            const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes
            if (elapsed > INACTIVITY_MS && userState.streak > 0) {
                userState = await prisma.userState.update({
                    where: { userId },
                    data: {
                        streak: 0,
                        momentum: Math.max(0, userState.momentum - 0.2),
                        stateVersion: { increment: 1 },
                    },
                });
            }
        }

        // Generate or reuse session ID
        const activeSessionId = sessionId || userState.sessionId || uuidv4();

        if (activeSessionId !== userState.sessionId) {
            await prisma.userState.update({
                where: { userId },
                data: { sessionId: activeSessionId },
            });
        }

        const difficulty = userState.currentDifficulty;

        // ── Gemini-first question generation ──
        const question = await getNextQuestion(difficulty, userState.lastQuestionId);

        if (!question) {
            return NextResponse.json(
                { error: 'No questions available. Try again shortly.' },
                { status: 503 }
            );
        }

        return NextResponse.json({
            questionId: question.questionId,
            difficulty: question.difficulty,
            prompt: question.prompt,
            choices: question.choices,
            category: question.category,
            sessionId: activeSessionId,
            stateVersion: userState.stateVersion,
            currentScore: userState.totalScore,
            currentStreak: userState.streak,
            maxStreak: userState.maxStreak,
            currentDifficulty: userState.currentDifficulty,
            momentum: userState.momentum,
            source: 'gemini', // Tells frontend we're using AI
        });
    } catch (error) {
        console.error('Quiz next error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
