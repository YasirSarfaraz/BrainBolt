'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// ─── Default Config Values ─────────────────────────────────────
const DEFAULT_CONFIG = {
    ui: {
        app_title: 'BrainBolt',
        app_subtitle: 'Adaptive Infinite Quiz Platform',
        app_logo_emoji: '⚡',
        difficulty_labels: {
            '1': 'Beginner', '2': 'Beginner',
            '3': 'Easy', '4': 'Easy',
            '5': 'Medium', '6': 'Medium',
            '7': 'Hard', '8': 'Hard',
            '9': 'Expert', '10': 'Expert',
        } as Record<string, string>,
        categories: ['general', 'science', 'technology', 'mathematics', 'history', 'geography'],
    },
    leaderboard: {
        leaderboard_size: 20,
        leaderboard_refresh_interval: 10000,
    },
    scoring: {
        scoring_base_multiplier: 10,
        scoring_streak_increment: 0.1,
        scoring_max_streak_multiplier: 3.0,
    },
    adaptive: {
        momentum_increase: 0.15,
        momentum_decrease: 0.30,
        momentum_threshold: 0.60,
        min_streak_to_increase: 2,
        inactivity_timeout_min: 30,
    },
    features: {
        enable_gemini: true,
        enable_leaderboard: true,
        enable_metrics: true,
        enable_dark_mode: true,
    },
};

export type AppConfig = typeof DEFAULT_CONFIG;

// ─── Context ───────────────────────────────────────────────────
const ConfigContext = createContext<{
    config: AppConfig;
    isLoaded: boolean;
    refreshConfig: () => Promise<void>;
}>({
    config: DEFAULT_CONFIG,
    isLoaded: false,
    refreshConfig: async () => { },
});

export function ConfigProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
    const [isLoaded, setIsLoaded] = useState(false);

    const fetchConfig = useCallback(async () => {
        try {
            const res = await fetch('/api/v1/config');
            if (!res.ok) throw new Error('Config fetch failed');
            const data = await res.json();

            // Deep merge with defaults to fill in any missing keys
            setConfig({
                ui: { ...DEFAULT_CONFIG.ui, ...(data.ui || {}) },
                leaderboard: { ...DEFAULT_CONFIG.leaderboard, ...(data.leaderboard || {}) },
                scoring: { ...DEFAULT_CONFIG.scoring, ...(data.scoring || {}) },
                adaptive: { ...DEFAULT_CONFIG.adaptive, ...(data.adaptive || {}) },
                features: { ...DEFAULT_CONFIG.features, ...(data.features || {}) },
            });
            setIsLoaded(true);
        } catch (err) {
            console.error('Failed to load config, using defaults:', err);
            setIsLoaded(true); // Use defaults on error
        }
    }, []);

    useEffect(() => {
        fetchConfig();
        // Auto-refresh config every 60 seconds
        const interval = setInterval(fetchConfig, 60000);
        return () => clearInterval(interval);
    }, [fetchConfig]);

    return (
        <ConfigContext.Provider value={{ config, isLoaded, refreshConfig: fetchConfig }}>
            {children}
        </ConfigContext.Provider>
    );
}

export const useConfig = () => useContext(ConfigContext);
