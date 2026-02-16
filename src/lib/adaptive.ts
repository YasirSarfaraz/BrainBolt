/**
 * BrainBolt Adaptive Difficulty Algorithm
 * 
 * Uses a momentum-based hysteresis system to prevent ping-pong instability.
 * 
 * Key concepts:
 * - Momentum (0.0 to 1.0): Confidence score tracking consistency
 * - Hysteresis: Difficulty only INCREASES when momentum >= MOMENTUM_THRESHOLD
 * - Difficulty decreases more readily on wrong answers (safety net)
 * - Rolling window of recent answers provides smoothing
 * - Min difficulty: 1, Max difficulty: 10
 */

// ============ Constants ============

export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 10;

// Momentum thresholds
const MOMENTUM_INCREASE_ON_CORRECT = 0.15;
const MOMENTUM_DECREASE_ON_WRONG = 0.3;
const MOMENTUM_THRESHOLD = 0.6; // Need this momentum to increase difficulty
const MOMENTUM_MIN = 0.0;
const MOMENTUM_MAX = 1.0;

// Rolling window
const ROLLING_WINDOW_SIZE = 10;

// Streak thresholds
const MIN_STREAK_TO_INCREASE = 2; // Need at least 2-streak to increase difficulty

// Inactivity decay
const INACTIVITY_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

// ============ Types ============

export interface AdaptiveState {
    currentDifficulty: number;
    momentum: number;
    streak: number;
    maxStreak: number;
    recentAnswers: boolean[]; // true = correct, false = wrong
    lastAnswerAt: Date | null;
}

export interface AdaptiveResult {
    newDifficulty: number;
    newMomentum: number;
    newStreak: number;
    newMaxStreak: number;
    newRecentAnswers: boolean[];
    streakReset: boolean;
    inactivityDecay: boolean;
}

// ============ Algorithm ============

export function computeNextState(
    state: AdaptiveState,
    isCorrect: boolean,
    now: Date = new Date()
): AdaptiveResult {
    let { currentDifficulty, momentum, streak, maxStreak, recentAnswers, lastAnswerAt } = state;

    // --- Step 1: Check for inactivity decay ---
    let inactivityDecay = false;
    if (lastAnswerAt) {
        const elapsed = now.getTime() - new Date(lastAnswerAt).getTime();
        if (elapsed > INACTIVITY_THRESHOLD_MS) {
            streak = 0;
            momentum = Math.max(MOMENTUM_MIN, momentum - 0.2);
            inactivityDecay = true;
        }
    }

    // --- Step 2: Update streak ---
    let streakReset = false;
    if (isCorrect) {
        streak += 1;
        if (streak > maxStreak) {
            maxStreak = streak;
        }
    } else {
        if (streak > 0) streakReset = true;
        streak = 0;
    }

    // --- Step 3: Update momentum ---
    if (isCorrect) {
        momentum = Math.min(MOMENTUM_MAX, momentum + MOMENTUM_INCREASE_ON_CORRECT);
    } else {
        momentum = Math.max(MOMENTUM_MIN, momentum - MOMENTUM_DECREASE_ON_WRONG);
    }

    // --- Step 4: Update rolling window ---
    const newRecentAnswers = [...recentAnswers, isCorrect].slice(-ROLLING_WINDOW_SIZE);

    // --- Step 5: Calculate rolling accuracy ---
    const windowAccuracy =
        newRecentAnswers.length > 0
            ? newRecentAnswers.filter(Boolean).length / newRecentAnswers.length
            : 0;

    // --- Step 6: Determine difficulty change ---
    let newDifficulty = currentDifficulty;

    if (isCorrect) {
        // Only increase difficulty if:
        // 1. momentum is above threshold (hysteresis)
        // 2. streak is at least MIN_STREAK_TO_INCREASE
        // 3. rolling window accuracy is above 60%
        if (
            momentum >= MOMENTUM_THRESHOLD &&
            streak >= MIN_STREAK_TO_INCREASE &&
            windowAccuracy >= 0.6
        ) {
            newDifficulty = Math.min(MAX_DIFFICULTY, currentDifficulty + 1);
        }
    } else {
        // Decrease difficulty on wrong answer (no threshold required — safety net)
        // But only decrease by 1 level
        newDifficulty = Math.max(MIN_DIFFICULTY, currentDifficulty - 1);
    }

    return {
        newDifficulty,
        newMomentum: Math.round(momentum * 1000) / 1000,
        newStreak: streak,
        newMaxStreak: maxStreak,
        newRecentAnswers,
        streakReset,
        inactivityDecay,
    };
}

/**
 * Get a human-readable difficulty label
 */
export function getDifficultyLabel(difficulty: number): string {
    if (difficulty <= 2) return 'Beginner';
    if (difficulty <= 4) return 'Easy';
    if (difficulty <= 6) return 'Medium';
    if (difficulty <= 8) return 'Hard';
    return 'Expert';
}
