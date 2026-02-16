'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useConfig } from '@/context/ConfigContext';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Button from '@/components/ui/Button';
import styles from './Navbar.module.css';

interface NavbarProps {
    activeTab: 'quiz' | 'leaderboard' | 'metrics' | 'settings';
    onTabChange: (tab: 'quiz' | 'leaderboard' | 'metrics' | 'settings') => void;
}

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
    const { user, logout } = useAuth();
    const { config } = useConfig();

    const appTitle = config.ui.app_title as string;
    const logoEmoji = config.ui.app_logo_emoji as string;
    const showLeaderboard = config.features.enable_leaderboard as boolean;
    const showMetrics = config.features.enable_metrics as boolean;
    const showDarkMode = config.features.enable_dark_mode as boolean;

    return (
        <header className={styles.navbar}>
            <div className={styles.brand} onClick={() => onTabChange('quiz')}>
                <span className={styles.brandIcon}>{logoEmoji}</span>
                {appTitle}
            </div>

            <nav className={styles.nav}>
                <button
                    className={`${styles.navBtn} ${activeTab === 'quiz' ? styles.navBtnActive : ''}`}
                    onClick={() => onTabChange('quiz')}
                >
                    <span>🧠</span> Quiz
                </button>
                {showLeaderboard && (
                    <button
                        className={`${styles.navBtn} ${activeTab === 'leaderboard' ? styles.navBtnActive : ''}`}
                        onClick={() => onTabChange('leaderboard')}
                    >
                        <span>🏆</span> Leaderboard
                    </button>
                )}
                {showMetrics && (
                    <button
                        className={`${styles.navBtn} ${activeTab === 'metrics' ? styles.navBtnActive : ''}`}
                        onClick={() => onTabChange('metrics')}
                    >
                        <span>📊</span> Metrics
                    </button>
                )}
                <button
                    className={`${styles.navBtn} ${activeTab === 'settings' ? styles.navBtnActive : ''}`}
                    onClick={() => onTabChange('settings')}
                >
                    <span>⚙️</span> Settings
                </button>
            </nav>

            <div className={styles.actions}>
                {user && (
                    <div className={styles.userInfo}>
                        <div className={styles.avatar}>{user.username.charAt(0)}</div>
                        <div>
                            <div className={styles.username}>{user.username}</div>
                        </div>
                    </div>
                )}
                {showDarkMode && <ThemeToggle />}
                <Button variant="ghost" size="sm" onClick={logout}>
                    Logout
                </Button>
            </div>
        </header>
    );
}
