import { prisma } from '@/lib/prisma';
import { generateQuestion } from '@/lib/gemini';

// ─── Configuration ─────────────────────────────────────────────
const POOL_SIZE_PER_DIFFICULTY = 10; // Keep 20 AI questions per difficulty
const MIN_POOL_THRESHOLD = 5; // Trigger refill when below 5

// ─── Pre-generate Questions in Background ──────────────────────
export async function refillQuestionPool(difficulty: number): Promise<void> {
    try {
        // Count existing AI-generated questions for this difficulty
        const count = await prisma.question.count({
            where: {
                difficulty,
                isAiGenerated: true,
            },
        });

        if (count >= POOL_SIZE_PER_DIFFICULTY) {
            console.log(`[QuestionPool] Difficulty ${difficulty} pool is full (${count}/${POOL_SIZE_PER_DIFFICULTY})`);
            return;
        }

        const needed = POOL_SIZE_PER_DIFFICULTY - count;
        console.log(`[QuestionPool] Refilling ${needed} questions for difficulty ${difficulty}...`);

        // Generate questions in parallel (batches of 3 to avoid rate limits)
        const batchSize = 3;
        for (let i = 0; i < needed; i += batchSize) {
            const batch = Math.min(batchSize, needed - i);
            const promises = Array(batch)
                .fill(null)
                .map(() => generateQuestion(difficulty));

            await Promise.all(promises);
            console.log(`[QuestionPool] Generated ${i + batch}/${needed} for difficulty ${difficulty}`);
        }

        console.log(`[QuestionPool] ✅ Refilled difficulty ${difficulty} pool`);
    } catch (error) {
        console.error(`[QuestionPool] Error refilling difficulty ${difficulty}:`, error);
    }
}

// ─── Check and Refill All Difficulty Levels ────────────────────
export async function refillAllPools(): Promise<void> {
    console.log('[QuestionPool] Starting full pool refill...');
    
    for (let difficulty = 1; difficulty <= 10; difficulty++) {
        await refillQuestionPool(difficulty);
    }
    
    console.log('[QuestionPool] ✅ Full refill complete');
}

// ─── Trigger Background Refill (Non-blocking) ──────────────────
export function triggerBackgroundRefill(difficulty: number): void {
    // Check pool size asynchronously
    prisma.question
        .count({
            where: {
                difficulty,
                isAiGenerated: true,
            },
        })
        .then((count) => {
            if (count < MIN_POOL_THRESHOLD) {
                console.log(`[QuestionPool] Pool low for difficulty ${difficulty} (${count}), triggering refill`);
                // Run refill in background (don't await)
                refillQuestionPool(difficulty).catch((err) =>
                    console.error('[QuestionPool] Background refill error:', err)
                );
            }
        })
        .catch((err) => console.error('[QuestionPool] Pool check error:', err));
}

// ─── Get Stats ──────────────────────────────────────────────────
export async function getPoolStats(): Promise<Record<number, { ai: number; seed: number }>> {
    const stats: Record<number, { ai: number; seed: number }> = {};

    for (let difficulty = 1; difficulty <= 10; difficulty++) {
        const [ai, seed] = await Promise.all([
            prisma.question.count({ where: { difficulty, isAiGenerated: true } }),
            prisma.question.count({ where: { difficulty, isAiGenerated: false } }),
        ]);
        stats[difficulty] = { ai, seed };
    }

    return stats;
}
