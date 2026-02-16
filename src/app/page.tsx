'use client';

import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useConfig } from '@/context/ConfigContext';
import AuthScreen from '@/components/AuthScreen';
import Navbar from '@/components/Navbar';
import QuizView from '@/components/QuizView';

const LeaderboardView = lazy(() => import('@/components/LeaderboardView'));
const MetricsView = lazy(() => import('@/components/MetricsView'));
const SettingsView = lazy(() => import('@/components/SettingsView'));

function LoadingFallback() {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-xxxl)',
            color: 'var(--text-secondary)',
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'pulse 1.5s ease-in-out infinite' }}>⚡</div>
                <p>Loading...</p>
            </div>
        </div>
    );
}

export default function HomePage() {
    const { user, isLoading } = useAuth();
    const { config } = useConfig();
    const [activeTab, setActiveTab] = useState<'quiz' | 'leaderboard' | 'metrics' | 'settings'>('quiz');

    const showLeaderboard = config.features.enable_leaderboard as boolean;
    const showMetrics = config.features.enable_metrics as boolean;

    if (isLoading) {
        return <LoadingFallback />;
    }

    if (!user) {
        return <AuthScreen />;
    }

    // If user navigates to disabled tab, redirect to quiz
    if (activeTab === 'leaderboard' && !showLeaderboard) setActiveTab('quiz');
    if (activeTab === 'metrics' && !showMetrics) setActiveTab('quiz');

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

            <main>
                <Suspense fallback={<LoadingFallback />}>
                    {activeTab === 'quiz' && <QuizView />}
                    {activeTab === 'leaderboard' && showLeaderboard && <LeaderboardView />}
                    {activeTab === 'metrics' && showMetrics && <MetricsView />}
                    {activeTab === 'settings' && <SettingsView />}
                </Suspense>
            </main>
        </div>
    );
}
