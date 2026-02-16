import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ConfigProvider } from '@/context/ConfigContext';
import '@/styles/globals.css';

export const metadata: Metadata = {
    title: 'BrainBolt — Adaptive Infinite Quiz Platform',
    description:
        'Challenge your knowledge with BrainBolt, an adaptive infinite quiz platform. Difficulty adjusts to your skill level with streaks, live leaderboards, and comprehensive metrics.',
    keywords: ['quiz', 'adaptive', 'learning', 'leaderboard', 'brainbolt'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" data-theme="dark" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <ThemeProvider>
                    <ConfigProvider>
                        <AuthProvider>{children}</AuthProvider>
                    </ConfigProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
