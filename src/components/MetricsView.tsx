'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProgressBar from '@/components/ui/ProgressBar';
import styles from './MetricsView.module.css';

interface MetricsData {
    currentDifficulty: number;
    streak: number;
    maxStreak: number;
    totalScore: number;
    totalAnswered: number;
    totalCorrect: number;
    accuracy: number;
    momentum: number;
    difficultyHistogram: Record<number, { total: number; correct: number }>;
    recentPerformance: Array<{
        difficulty: number;
        correct: boolean;
        scoreDelta: number;
        streakAtAnswer: number;
        answeredAt: string;
    }>;
    lastAnswerAt: string | null;
}

export default function MetricsView() {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<MetricsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchMetrics = async () => {
            try {
                const res = await fetch(`/api/v1/quiz/metrics?userId=${user.userId}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                setMetrics(data);
            } catch (err) {
                console.error('Metrics fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 15000);
        return () => clearInterval(interval);
    }, [user]);

    if (isLoading || !metrics) {
        return (
            <div className={styles.metricsContainer}>
                <div className={styles.loading}>Loading metrics...</div>
            </div>
        );
    }

    const maxHistTotal = Math.max(
        ...Object.values(metrics.difficultyHistogram).map((h) => h.total),
        1
    );

    const formatTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div className={styles.metricsContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>📊 Your Metrics</h1>
                <p className={styles.subtitle}>Track your performance and progress</p>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>🏆</span>
                    <div className={styles.statValue}>{metrics.totalScore.toLocaleString()}</div>
                    <div className={styles.statLabel}>Total Score</div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>🔥</span>
                    <div className={styles.statValue}>{metrics.streak}</div>
                    <div className={styles.statLabel}>Current Streak</div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>⭐</span>
                    <div className={styles.statValue}>{metrics.maxStreak}</div>
                    <div className={styles.statLabel}>Max Streak</div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>🎯</span>
                    <div className={styles.statValue}>{metrics.accuracy}%</div>
                    <div className={styles.statLabel}>Accuracy</div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>📝</span>
                    <div className={styles.statValue}>{metrics.totalAnswered}</div>
                    <div className={styles.statLabel}>Questions Answered</div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>✅</span>
                    <div className={styles.statValue}>{metrics.totalCorrect}</div>
                    <div className={styles.statLabel}>Correct Answers</div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>🧠</span>
                    <div className={styles.statValue}>Lvl {metrics.currentDifficulty}</div>
                    <div className={styles.statLabel}>Current Difficulty</div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>💫</span>
                    <div className={styles.statValue}>{Math.round(metrics.momentum * 100)}%</div>
                    <div className={styles.statLabel}>Momentum</div>
                </div>
            </div>

            {/* Momentum Progress */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Difficulty Momentum</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-md)' }}>
                    Momentum needs to reach 60% before difficulty increases. This prevents ping-pong instability.
                </p>
                <ProgressBar value={metrics.momentum * 100} label="Momentum" />
            </div>

            {/* Difficulty Histogram */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Difficulty Distribution</h3>
                <div className={styles.histogram}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((d) => {
                        const data = metrics.difficultyHistogram[d] || { total: 0, correct: 0 };
                        const heightPct = data.total > 0 ? (data.total / maxHistTotal) * 100 : 2;
                        const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;

                        return (
                            <div key={d} className={styles.histBar}>
                                <span className={styles.histValue}>
                                    {data.total > 0 ? `${accuracy}%` : ''}
                                </span>
                                <div
                                    className={styles.histFill}
                                    style={{ height: `${heightPct}%` }}
                                    title={`Level ${d}: ${data.total} questions, ${data.correct} correct (${accuracy}%)`}
                                />
                                <span className={styles.histLabel}>L{d}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Performance */}
            {metrics.recentPerformance.length > 0 && (
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Recent Performance</h3>
                    <div className={styles.recentList}>
                        {metrics.recentPerformance.map((entry, idx) => (
                            <div key={idx} className={styles.recentItem}>
                                <span className={styles.recentIcon}>
                                    {entry.correct ? '✅' : '❌'}
                                </span>
                                <div className={styles.recentInfo}>
                                    <div className={styles.recentDifficulty}>
                                        Level {entry.difficulty}
                                        {entry.streakAtAnswer > 0 && ` • 🔥 ${entry.streakAtAnswer} streak`}
                                    </div>
                                    <div className={styles.recentTime}>
                                        {formatTimeAgo(entry.answeredAt)}
                                    </div>
                                </div>
                                <div className={styles.recentScore}>
                                    {entry.scoreDelta > 0 ? `+${entry.scoreDelta}` : entry.scoreDelta}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
