'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useConfig } from '@/context/ConfigContext';
import { v4 as uuidv4 } from 'uuid';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Badge from '@/components/ui/Badge';
import styles from './QuizView.module.css';

interface QuestionData {
    questionId: string;
    difficulty: number;
    prompt: string;
    choices: string[];
    category: string;
    sessionId: string;
    stateVersion: number;
    currentScore: number;
    currentStreak: number;
    maxStreak: number;
    currentDifficulty: number;
    momentum: number;
    source?: string;
}

interface AnswerResult {
    correct: boolean;
    correctAnswer: number;
    newDifficulty: number;
    newStreak: number;
    maxStreak: number;
    scoreDelta: number;
    totalScore: number;
    momentum: number;
    stateVersion: number;
    streakReset: boolean;
    leaderboardRankScore: number;
    leaderboardRankStreak: number;
    aiFeedback?: string;
    aiExplanation?: string | null;
}

export default function QuizView() {
    const { user } = useAuth();
    const { config } = useConfig();
    const [question, setQuestion] = useState<QuestionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    const [stats, setStats] = useState({
        score: 0,
        streak: 0,
        maxStreak: 0,
        difficulty: 1,
        momentum: 0,
        rank: 0,
    });

    const difficultyLabels = config.ui.difficulty_labels as Record<string, string>;

    const fetchNextQuestion = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        setSelectedAnswer(null);
        setAnswerResult(null);

        try {
            const params = new URLSearchParams({ userId: user.userId });
            if (sessionId) params.append('sessionId', sessionId);

            const res = await fetch(`/api/v1/quiz/next?${params}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setQuestion(data);
            setSessionId(data.sessionId);
            setStats({
                score: data.currentScore,
                streak: data.currentStreak,
                maxStreak: data.maxStreak,
                difficulty: data.currentDifficulty,
                momentum: data.momentum,
                rank: stats.rank,
            });
        } catch (err) {
            console.error('Failed to fetch question:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user, sessionId, stats.rank]);

    useEffect(() => {
        fetchNextQuestion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleAnswer = async (answerIndex: number) => {
        if (!user || !question || answerResult || isSubmitting) return;

        setSelectedAnswer(answerIndex);
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/v1/quiz/answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.userId,
                    sessionId,
                    questionId: question.questionId,
                    answer: answerIndex,
                    stateVersion: question.stateVersion,
                    answerIdempotencyKey: uuidv4(),
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setAnswerResult(data);
            setStats({
                score: data.totalScore,
                streak: data.newStreak,
                maxStreak: data.maxStreak,
                difficulty: data.newDifficulty,
                momentum: data.momentum,
                rank: data.leaderboardRankScore,
            });

            // Auto-next after 5 seconds
            setTimeout(() => {
                fetchNextQuestion();
            }, 5000);
        } catch (err) {
            console.error('Failed to submit answer:', err);
            setSelectedAnswer(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getDifficultyClass = (d: number) => {
        if (d <= 3) return styles.diffEasy;
        if (d <= 6) return styles.diffMedium;
        if (d <= 8) return styles.diffHard;
        return styles.diffExpert;
    };

    const getDifficultyLabel = (d: number) => {
        return difficultyLabels[String(d)] || `Level ${d}`;
    };

    const choiceLabel = ['A', 'B', 'C', 'D'];

    if (isLoading && !question) {
        return (
            <div className={styles.quizContainer}>
                <div className={styles.loading}>
                    <span className={styles.loadingIcon}>⚡</span>
                    <p className={styles.loadingText}>Generating your next challenge with AI...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.quizContainer}>
            {/* Stats Bar */}
            <div className={styles.statsBar}>
                <div className={styles.statCard}>
                    <div className={`${styles.statValue} ${styles.statHighlight}`}>{stats.score.toLocaleString()}</div>
                    <div className={styles.statLabel}>Score</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statValue} ${styles.streakFire}`}>
                        {stats.streak > 0 ? '🔥 ' : ''}{stats.streak}
                    </div>
                    <div className={styles.statLabel}>Streak</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>⭐ {stats.maxStreak}</div>
                    <div className={styles.statLabel}>Max Streak</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>
                        {stats.rank > 0 ? `#${stats.rank}` : '—'}
                    </div>
                    <div className={styles.statLabel}>Rank</div>
                </div>
            </div>

            {/* Momentum Bar */}
            <div className={styles.momentumBar}>
                <div className={styles.momentumLabel}>
                    <span className={styles.momentumText}>Difficulty Momentum</span>
                    <span className={styles.momentumValue}>{Math.round(stats.momentum * 100)}%</span>
                </div>
                <ProgressBar value={stats.momentum * 100} showValue={false} size="sm" />
            </div>

            {/* Question Card */}
            {question && (
                <div className={styles.questionCard} key={question.questionId}>
                    <div className={styles.questionHeader}>
                        <span className={`${styles.difficultyBadge} ${getDifficultyClass(question.difficulty)}`}>
                            Lvl {question.difficulty} • {getDifficultyLabel(question.difficulty)}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <span className={styles.categoryBadge}>{question.category}</span>
                            {question.source === 'gemini' && (
                                <Badge variant="primary" pulse>✨ AI Generated</Badge>
                            )}
                        </div>
                    </div>

                    <h2 className={styles.questionPrompt}>{question.prompt}</h2>

                    <div className={styles.choices}>
                        {question.choices.map((choice, idx) => {
                            let extraClass = '';
                            if (answerResult) {
                                if (idx === answerResult.correctAnswer) {
                                    extraClass = styles.choiceCorrect;
                                } else if (idx === selectedAnswer && !answerResult.correct) {
                                    extraClass = styles.choiceWrong;
                                }
                            } else if (idx === selectedAnswer) {
                                extraClass = styles.choiceSelected;
                            }

                            return (
                                <button
                                    key={idx}
                                    className={`${styles.choiceBtn} ${extraClass}`}
                                    onClick={() => handleAnswer(idx)}
                                    disabled={!!answerResult || isSubmitting}
                                >
                                    <span className={styles.choicePrefix}>{choiceLabel[idx]}</span>
                                    {choice}
                                </button>
                            );
                        })}
                    </div>

                    {/* Feedback */}
                    {answerResult && (
                        <div
                            className={`${styles.feedback} ${answerResult.correct ? styles.feedbackCorrect : styles.feedbackWrong
                                }`}
                        >
                            <span className={styles.feedbackIcon}>
                                {answerResult.correct ? '🎉' : '😔'}
                            </span>
                            <div className={styles.feedbackTitle}>
                                {answerResult.correct ? 'Correct!' : 'Wrong Answer'}
                            </div>

                            {/* AI Feedback Message */}
                            {answerResult.aiFeedback && (
                                <div className={styles.aiFeedbackMessage}>
                                    ✨ {answerResult.aiFeedback}
                                </div>
                            )}

                            <div className={styles.feedbackStats}>
                                <div className={styles.feedbackStat}>
                                    <span className={styles.feedbackStatValue}>
                                        +{answerResult.scoreDelta}
                                    </span>
                                    <span className={styles.feedbackStatLabel}>Points</span>
                                </div>
                                <div className={styles.feedbackStat}>
                                    <span className={styles.feedbackStatValue}>
                                        {answerResult.newStreak > 0 ? `🔥 ${answerResult.newStreak}` : '0'}
                                    </span>
                                    <span className={styles.feedbackStatLabel}>Streak</span>
                                </div>
                                <div className={styles.feedbackStat}>
                                    <span className={styles.feedbackStatValue}>
                                        Lvl {answerResult.newDifficulty}
                                    </span>
                                    <span className={styles.feedbackStatLabel}>Next Difficulty</span>
                                </div>
                                <div className={styles.feedbackStat}>
                                    <span className={styles.feedbackStatValue}>
                                        #{answerResult.leaderboardRankScore}
                                    </span>
                                    <span className={styles.feedbackStatLabel}>Rank</span>
                                </div>
                            </div>

                            {/* AI Explanation (only for wrong answers) */}
                            {!answerResult.correct && answerResult.aiExplanation && (
                                <div className={styles.aiExplanation}>
                                    <div className={styles.aiExplanationTitle}>💡 Why?</div>
                                    <div className={styles.aiExplanationText}>
                                        {answerResult.aiExplanation}
                                    </div>
                                </div>
                            )}

                            <div className={styles.nextBtn}>
                                <Button size="lg" onClick={fetchNextQuestion}>
                                    Next Question →
                                </Button>
                                <div className={styles.autoNextHint}>
                                    Auto-loading next question in 5s...
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
