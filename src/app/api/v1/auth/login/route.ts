import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username } = body;

        if (!username || typeof username !== 'string') {
            return NextResponse.json(
                { error: 'Username is required' },
                { status: 400 }
            );
        }

        const cleanUsername = username.trim().toLowerCase();

        const user = await prisma.user.findUnique({
            where: { username: cleanUsername },
            include: { state: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            userId: user.id,
            username: user.username,
            currentDifficulty: user.state?.currentDifficulty ?? 1,
            streak: user.state?.streak ?? 0,
            totalScore: user.state?.totalScore ?? 0,
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
