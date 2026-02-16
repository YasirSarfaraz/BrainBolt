import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username } = body;

        if (!username || typeof username !== 'string' || username.trim().length < 2) {
            return NextResponse.json(
                { error: 'Username must be at least 2 characters' },
                { status: 400 }
            );
        }

        const cleanUsername = username.trim().toLowerCase();

        // Check if username exists
        const existing = await prisma.user.findUnique({
            where: { username: cleanUsername },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Username already taken' },
                { status: 409 }
            );
        }

        // Create user with initial state
        const user = await prisma.user.create({
            data: {
                username: cleanUsername,
                state: {
                    create: {
                        currentDifficulty: 1,
                        streak: 0,
                        maxStreak: 0,
                        totalScore: 0,
                        totalAnswered: 0,
                        totalCorrect: 0,
                        momentum: 0,
                        recentAnswers: [],
                    },
                },
                leaderScore: {
                    create: {
                        totalScore: 0,
                        username: cleanUsername,
                    },
                },
                leaderStreak: {
                    create: {
                        maxStreak: 0,
                        username: cleanUsername,
                    },
                },
            },
            include: { state: true },
        });

        return NextResponse.json({
            userId: user.id,
            username: user.username,
            message: 'Registration successful',
        });
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
