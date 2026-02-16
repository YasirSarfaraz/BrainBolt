'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface User {
    userId: string;
    username: string;
    currentDifficulty?: number;
    streak?: number;
    totalScore?: number;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (username: string) => Promise<void>;
    register: (username: string) => Promise<void>;
    logout: () => void;
    error: string | null;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Restore from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('brainbolt_user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                localStorage.removeItem('brainbolt_user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (username: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');

            const userObj: User = {
                userId: data.userId,
                username: data.username,
                currentDifficulty: data.currentDifficulty,
                streak: data.streak,
                totalScore: data.totalScore,
            };
            setUser(userObj);
            localStorage.setItem('brainbolt_user', JSON.stringify(userObj));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(async (username: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');

            const userObj: User = {
                userId: data.userId,
                username: data.username,
                currentDifficulty: 1,
                streak: 0,
                totalScore: 0,
            };
            setUser(userObj);
            localStorage.setItem('brainbolt_user', JSON.stringify(userObj));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('brainbolt_user');
    }, []);

    const clearError = useCallback(() => setError(null), []);

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout, error, clearError }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
