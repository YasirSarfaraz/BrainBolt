import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
    variant?: 'text' | 'heading' | 'avatar' | 'card';
    width?: string | number;
    height?: string | number;
    className?: string;
}

export default function Skeleton({ variant = 'text', width, height, className }: SkeletonProps) {
    const classes = [
        styles.skeleton,
        styles[variant],
        className,
    ].filter(Boolean).join(' ');

    return (
        <div
            className={classes}
            style={{ width: width || undefined, height: height || undefined }}
            aria-hidden="true"
        />
    );
}
