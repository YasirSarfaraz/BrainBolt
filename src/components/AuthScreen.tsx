'use client';

import React, { useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useConfig } from '@/context/ConfigContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from './AuthScreen.module.css';

export default function AuthScreen() {
    const { login, register, error, clearError, isLoading } = useAuth();
    const { config } = useConfig();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');

    const appTitle = config.ui.app_title as string;
    const appSubtitle = config.ui.app_subtitle as string;
    const logoEmoji = config.ui.app_logo_emoji as string;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        clearError();
        try {
            if (mode === 'login') {
                await login(username);
            } else {
                await register(username);
            }
        } catch {
            // Error is already set in context
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>{logoEmoji}</span>
                    <h1 className={styles.logoTitle}>{appTitle}</h1>
                    <p className={styles.logoSubtitle}>{appSubtitle}</p>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
                        onClick={() => { setMode('login'); clearError(); }}
                    >
                        Sign In
                    </button>
                    <button
                        className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`}
                        onClick={() => { setMode('register'); clearError(); }}
                    >
                        Sign Up
                    </button>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <Input
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        inputSize="lg"
                        autoFocus
                        autoComplete="username"
                    />

                    {error && <div className={styles.errorMsg}>{error}</div>}

                    <Button type="submit" size="lg" fullWidth isLoading={isLoading}>
                        {mode === 'login' ? '🚀 Start Playing' : '✨ Create Account'}
                    </Button>
                </form>

                <div className={styles.features}>
                    <div className={styles.feature}>
                        <span className={styles.featureIcon}>🤖</span>
                        <span>AI-Powered</span>
                    </div>
                    <div className={styles.feature}>
                        <span className={styles.featureIcon}>🧠</span>
                        <span>Adaptive</span>
                    </div>
                    <div className={styles.feature}>
                        <span className={styles.featureIcon}>🔥</span>
                        <span>Streaks</span>
                    </div>
                    <div className={styles.feature}>
                        <span className={styles.featureIcon}>🏆</span>
                        <span>Leaderboard</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
