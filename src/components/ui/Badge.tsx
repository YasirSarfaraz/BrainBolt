import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
    variant?: 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info' | 'accent';
    size?: 'sm' | 'lg';
    pulse?: boolean;
    children: React.ReactNode;
    className?: string;
}

export default function Badge({ variant = 'default', size, pulse, children, className }: BadgeProps) {
    const classes = [
        styles.badge,
        styles[variant],
        size === 'lg' && styles.lg,
        pulse && styles.pulse,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return <span className={classes}>{children}</span>;
}
