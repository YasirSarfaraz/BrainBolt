import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis';

const CONFIG_CACHE_KEY = 'app:config';
const CONFIG_CACHE_TTL = 60; // 60 seconds

export async function GET() {
    try {
        // Check cache first
        const cached = await cacheGet<Record<string, Record<string, unknown>>>(CONFIG_CACHE_KEY);
        if (cached) {
            return NextResponse.json(cached);
        }

        // Fetch all config from database
        const configs = await prisma.appConfig.findMany();

        // Group by category
        const grouped: Record<string, Record<string, unknown>> = {};
        for (const config of configs) {
            if (!grouped[config.category]) {
                grouped[config.category] = {};
            }
            grouped[config.category][config.key] = config.value;
        }

        // Cache the result
        await cacheSet(CONFIG_CACHE_KEY, grouped, CONFIG_CACHE_TTL);

        return NextResponse.json(grouped);
    } catch (error) {
        console.error('Config fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch config' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { configs } = body;

        if (!Array.isArray(configs)) {
            return NextResponse.json(
                { error: 'configs must be an array' },
                { status: 400 }
            );
        }

        // Update all configs in a transaction
        await prisma.$transaction(
            configs.map((config: { key: string; value: any; category: string; label: string }) =>
                prisma.appConfig.upsert({
                    where: { key: config.key },
                    update: {
                        value: config.value,
                        category: config.category,
                        label: config.label,
                    },
                    create: {
                        key: config.key,
                        value: config.value,
                        category: config.category,
                        label: config.label,
                    },
                })
            )
        );

        // Invalidate cache
        await cacheDel(CONFIG_CACHE_KEY);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Config update error:', error);
        return NextResponse.json(
            { error: 'Failed to update config' },
            { status: 500 }
        );
    }
}
