/**
 * BrainBolt Score Calculation System
 * 
 * Score formula:
 *   scoreDelta = baseDifficultyScore(difficulty) × streakMultiplier(streak)
 * 
 * baseDifficultyScore = difficulty × 10  (range: 10-100 per question)
 * streakMultiplier = min(1 + streak × 0.1, MAX_STREAK_MULTIPLIER)
 * 
 * Wrong answers = 0 points (no negative scoring)
 */

// ============ Constants ============

export const MAX_STREAK_MULTIPLIER = 3.0;
const STREAK_MULTIPLIER_INCREMENT = 0.1;

// ============ Functions ============

/**
 * Calculate the base score for a question at a given difficulty
 * Higher difficulty = more points
 */
export function baseDifficultyScore(difficulty: number): number {
    return difficulty * 10;
}

/**
 * Calculate the streak multiplier
 * Starts at 1.0x, increases by 0.1x per streak, capped at MAX_STREAK_MULTIPLIER
 */
export function streakMultiplier(streak: number): number {
    return Math.min(1 + streak * STREAK_MULTIPLIER_INCREMENT, MAX_STREAK_MULTIPLIER);
}

/**
 * Calculate score delta for an answer
 * Returns 0 for wrong answers (no negative scoring)
 */
export function calculateScoreDelta(
    difficulty: number,
    streak: number,
    isCorrect: boolean
): number {
    if (!isCorrect) return 0;

    const base = baseDifficultyScore(difficulty);
    const multiplier = streakMultiplier(streak);
    return Math.round(base * multiplier);
}

/**
 * Calculate accuracy percentage
 */
export function calculateAccuracy(totalCorrect: number, totalAnswered: number): number {
    if (totalAnswered === 0) return 0;
    return Math.round((totalCorrect / totalAnswered) * 10000) / 100; // 2 decimal places
}

/**
 * Generate a difficulty histogram from recent answers
 */
export function generateDifficultyHistogram(
    answerLogs: { difficulty: number; correct: boolean }[]
): Record<number, { total: number; correct: number }> {
    const histogram: Record<number, { total: number; correct: number }> = {};

    for (let d = 1; d <= 10; d++) {
        histogram[d] = { total: 0, correct: 0 };
    }

    for (const log of answerLogs) {
        if (histogram[log.difficulty]) {
            histogram[log.difficulty].total += 1;
            if (log.correct) {
                histogram[log.difficulty].correct += 1;
            }
        }
    }

    return histogram;
}
