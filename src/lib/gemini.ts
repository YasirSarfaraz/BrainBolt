import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet, CacheKeys } from '@/lib/redis';
import { triggerBackgroundRefill } from '@/lib/question-pool';

// ─── Gemini Client ─────────────────────────────────────────────
// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

// Using Gemini 2.5 Flash as it's the latest stable model
const GEMINI_MODEL = 'gemini-2.5-flash';

// ─── Types ─────────────────────────────────────────────────────
interface GeneratedQuestion {
    prompt: string;
    choices: string[];
    correctIndex: number;
    category: string;
}

// ─── Category list (overridden by DB config when available) ────
const DEFAULT_CATEGORIES = [
    'science', 'technology', 'mathematics', 'history', 'geography',
    'literature', 'pop_culture', 'sports', 'nature', 'general_knowledge',
];

// ─── Difficulty descriptors for the prompt ─────────────────────
const DIFFICULTY_DESCRIPTORS: Record<number, string> = {
    1: 'very easy, suitable for a young child',
    2: 'easy, basic common knowledge',
    3: 'easy-medium, elementary school level',
    4: 'medium, middle school level',
    5: 'medium, high school level',
    6: 'medium-hard, requires good general knowledge',
    7: 'hard, requires specific domain knowledge',
    8: 'hard, college-level knowledge',
    9: 'very hard, expert-level knowledge required',
    10: 'extremely hard, PhD-level or obscure knowledge',
};

// ─── Generate a Question via Gemini ────────────────────────────
export async function generateQuestion(
    difficulty: number,
    category?: string,
): Promise<{ questionId: string; question: GeneratedQuestion } | null> {
    try {
        const selectedCategory = category ||
            DEFAULT_CATEGORIES[Math.floor(Math.random() * DEFAULT_CATEGORIES.length)];

        const diffDesc = DIFFICULTY_DESCRIPTORS[difficulty] || `difficulty level ${difficulty} out of 10`;

        const prompt = `Generate a single quiz question with the following requirements:
- Category: ${selectedCategory}
- Difficulty: ${diffDesc}
- The question must have EXACTLY 4 answer choices
- Exactly one answer must be correct
- The wrong answers should be plausible but clearly incorrect to someone who knows the answer
- Do NOT include "All of the above" or "None of the above" as choices

Respond ONLY with valid JSON in this exact format, no markdown, no extra text:
{
  "prompt": "Your question here?",
  "choices": ["Choice A", "Choice B", "Choice C", "Choice D"],
  "correctIndex": 0,
  "category": "${selectedCategory}"
}

Where correctIndex is the 0-based index of the correct answer.`;

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
        });
        const text = response.text;

        // Parse JSON (handle markdown code blocks)
        let jsonStr = text.trim();
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        const parsed: GeneratedQuestion = JSON.parse(jsonStr);

        // Validate structure
        if (
            !parsed.prompt ||
            !Array.isArray(parsed.choices) ||
            parsed.choices.length !== 4 ||
            typeof parsed.correctIndex !== 'number' ||
            parsed.correctIndex < 0 ||
            parsed.correctIndex > 3
        ) {
            console.error('[Gemini] Invalid question structure:', parsed);
            return null;
        }

        // Save to database for answer verification and pooling
        const saved = await prisma.question.create({
            data: {
                difficulty,
                prompt: parsed.prompt,
                choices: parsed.choices,
                correctIndex: parsed.correctIndex,
                category: parsed.category || selectedCategory,
                isAiGenerated: true,
            },
        });

        return {
            questionId: saved.id,
            question: parsed,
        };
    } catch (error) {
        console.error('[Gemini] Question generation failed:', error);
        return null;
    }
}

// ─── Get Question (DB-first with AI pool, fallback to seed) ───
export async function getNextQuestion(
    difficulty: number,
    lastQuestionId?: string | null,
): Promise<{
    questionId: string;
    difficulty: number;
    prompt: string;
    choices: string[];
    category: string;
} | null> {
    // 1. Try to get pre-generated AI question from database (FAST!)
    const aiQuestions = await prisma.question.findMany({
        where: {
            difficulty,
            isAiGenerated: true,
            id: lastQuestionId ? { not: lastQuestionId } : undefined,
        },
        select: { id: true, prompt: true, choices: true, category: true },
        take: 10, // Get a small pool to randomize from
    });

    if (aiQuestions.length > 0) {
        const selected = aiQuestions[Math.floor(Math.random() * aiQuestions.length)];
        
        // Trigger background refill if pool is getting low (non-blocking)
        triggerBackgroundRefill(difficulty);
        
        return {
            questionId: selected.id,
            difficulty,
            prompt: selected.prompt,
            choices: selected.choices,
            category: selected.category,
        };
    }

    // 2. Fallback: serve from seeded DB questions
    console.warn('[Gemini] No AI questions in pool, falling back to seed questions');

    const cacheKey = CacheKeys.questionPool(difficulty);
    let pool = await cacheGet<Array<{
        id: string;
        prompt: string;
        choices: string[];
        category: string;
    }>>(cacheKey);

    if (!pool) {
        const dbQuestions = await prisma.question.findMany({
            where: { difficulty, isAiGenerated: false },
            select: { id: true, prompt: true, choices: true, category: true },
        });
        if (dbQuestions.length > 0) {
            pool = dbQuestions;
            await cacheSet(cacheKey, pool, 600); // 10 min cache
        }
    }

    if (!pool || pool.length === 0) {
        // Last resort: try to generate one in real-time (slow but better than nothing)
        console.warn('[Gemini] No seed questions either, generating in real-time...');
        const geminiResult = await generateQuestion(difficulty);
        
        if (geminiResult) {
            return {
                questionId: geminiResult.questionId,
                difficulty,
                prompt: geminiResult.question.prompt,
                choices: geminiResult.question.choices,
                category: geminiResult.question.category,
            };
        }
        
        return null;
    }

    // Exclude last question to avoid repeats
    const filtered = lastQuestionId
        ? pool.filter((q) => q.id !== lastQuestionId)
        : pool;

    const candidates = filtered.length > 0 ? filtered : pool;
    const selected = candidates[Math.floor(Math.random() * candidates.length)];

    // Trigger background refill for next time
    triggerBackgroundRefill(difficulty);

    return {
        questionId: selected.id,
        difficulty,
        prompt: selected.prompt,
        choices: selected.choices,
        category: selected.category,
    };
}

// ─── Generate AI Feedback Message ──────────────────────────────────────────────
export async function generateFeedback(
    isCorrect: boolean,
    streak: number,
    difficulty: number,
    questionPrompt: string,
): Promise<string> {
    try {
        const context = isCorrect
            ? `The user just answered a difficulty ${difficulty} question CORRECTLY. Their current streak is ${streak}.`
            : `The user just answered a difficulty ${difficulty} question INCORRECTLY. Their streak was reset to 0.`;

        const tone = streak >= 5
            ? 'super enthusiastic and motivating'
            : streak >= 3
                ? 'encouraging and positive'
                : isCorrect
                    ? 'friendly and supportive'
                    : 'gentle and encouraging';

        const prompt = `${context}
Generate a SHORT (max 15 words) ${tone} feedback message.

Guidelines:
- If correct: congratulate, mention streak if >= 3, keep them motivated
- If incorrect: be supportive, encourage them to keep trying, mention it's okay
- Use emojis sparingly (max 1-2)
- Be casual and fun
- NO generic phrases like "Great job!" - be creative

Examples:
- "Beast mode activated! 🔥 5-streak and counting!"
- "Oops! But hey, that was a tough one. You got this! 💪"
- "Nailed it! Your brain is on fire today! 🧠"

Respond with ONLY the feedback message, no quotes, no extra text.`;

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
        });
        const text = response.text.trim();

        // Remove quotes if Gemini added them
        return text.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    } catch (error) {
        console.error('[Gemini] Feedback generation failed:', error);
        // Fallback messages
        if (isCorrect) {
            if (streak >= 5) return `🔥 ${streak}-streak! You're unstoppable!`;
            if (streak >= 3) return `Nice! ${streak} in a row!`;
            return '✅ Correct! Keep it up!';
        } else {
            const fallbacks = [
                '💪 Don\'t sweat it! Try again!',
                '🎯 Close! You\'ll get the next one!',
                '🌟 Learning moment! Keep going!',
            ];
            return fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
    }
}

// ─── Generate Explanation for Answer ───────────────────────────────────────────
export async function generateExplanation(
    questionPrompt: string,
    correctChoice: string,
    userChoice: string,
    isCorrect: boolean,
): Promise<string | null> {
    try {
        const prompt = `Question: ${questionPrompt}
Correct Answer: ${correctChoice}
${!isCorrect ? `User's Answer: ${userChoice}\n` : ''}

Provide a brief (2-3 sentences) explanation of why "${correctChoice}" is correct${!isCorrect ? ` and why "${userChoice}" is wrong` : ''}.

Be concise, educational, and friendly. Add a fun fact if relevant.

Respond with ONLY the explanation, no preamble.`;

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error('[Gemini] Explanation generation failed:', error);
        return null;
    }
}
