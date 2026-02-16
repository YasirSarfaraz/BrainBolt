'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useConfig } from '@/context/ConfigContext';
import Button from '@/components/ui/Button';
import styles from './LeaderboardView.module.css';

interface LeaderboardEntry {
    userId: string;
    username: string;
    totalScore?: number;
    maxStreak?: number;
    rank: number;
}

type TabType = 'score' | 'streak';

export default function LeaderboardView() {
    const { user } = useAuth();
    const { config } = useConfig();
    const [tab, setTab] = useState<TabType>('score');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const leaderboardSize = config.leaderboard.leaderboard_size as number;
    const refreshInterval = config.leaderboard.leaderboard_refresh_interval as number;

    const fetchLeaderboard = useCallback(async () => {
        if (!user) return;

        try {
            const endpoint = tab === 'score' ? 'score' : 'streak';
            const res = await fetch(
                `/api/v1/leaderboard/${endpoint}?limit=${leaderboardSize}&userId=${user.userId}`
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setEntries(data.leaderboard);
            setUserRank(data.userRank);
        } catch (err) {
            console.error('Leaderboard fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user, tab, leaderboardSize]);

    useEffect(() => {
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, refreshInterval);
        return () => clearInterval(interval);
    }, [fetchLeaderboard, refreshInterval]);

    const getMedal = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `${rank}`;
    };

    return (
        <div className={styles.leaderboardContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>🏆 Leaderboard</h1>
                <p className={styles.subtitle}>Compete with other players worldwide</p>
            </div>

            {/* Live indicator */}
            <div style={{ textAlign: 'center' }}>
                <span className={styles.liveIndicator}>
                    <span className={styles.liveDot} />
                    LIVE — Updates every {Math.round(refreshInterval / 1000)}s
                </span>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${tab === 'score' ? styles.tabActive : ''}`}
                    onClick={() => setTab('score')}
                >
                    🏅 Top Score
                </button>
                <button
                    className={`${styles.tab} ${tab === 'streak' ? styles.tabActive : ''}`}
                    onClick={() => setTab('streak')}
                >
                    🔥 Top Streak
                </button>
            </div>

            {/* User Rank Banner */}
            {userRank && (
                <div className={styles.userRank}>
                    <div>
                        <div className={styles.userRankLabel}>Your Current Rank</div>
                        <div className={styles.userRankInfo}>
                            <span className={styles.userRankPosition}>#{userRank.rank}</span>
                        </div>
                    </div>
                    <div className={styles.userRankValue}>
                        {tab === 'score'
                            ? `${(userRank.totalScore ?? 0).toLocaleString()} pts`
                            : `${userRank.maxStreak ?? 0} streak`}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className={styles.table}>
                <div className={styles.tableHeader}>
                    <div>Rank</div>
                    <div>Player</div>
                    <div style={{ textAlign: 'right' }}>
                        {tab === 'score' ? 'Score' : 'Streak'}
                    </div>
                </div>

                {entries.length === 0 && !isLoading && (
                    <div className={styles.empty}>
                        <p>No entries yet. Start playing to appear!</p>
                    </div>
                )}

                {entries.map((entry, idx) => (
                    <div
                        key={entry.userId}
                        className={`${styles.tableRow} ${entry.userId === user?.userId ? styles.tableRowHighlight : ''
                            }`}
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        <div className={entry.rank <= 3 ? styles.medalRank : styles.rank}>
                            {getMedal(entry.rank)}
                        </div>
                        <div className={styles.userCell}>
                            <div className={styles.avatar}>
                                {entry.username.charAt(0)}
                            </div>
                            <div className={styles.userName}>
                                {entry.username}
                                {entry.userId === user?.userId && ' (you)'}
                            </div>
                        </div>
                        <div className={styles.valueCell}>
                            {tab === 'score'
                                ? (entry.totalScore ?? 0).toLocaleString()
                                : `🔥 ${entry.maxStreak ?? 0}`}
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.refreshBtn}>
                <Button variant="secondary" onClick={fetchLeaderboard}>
                    ↻ Refresh
                </Button>
            </div>
        </div>
    );
}
