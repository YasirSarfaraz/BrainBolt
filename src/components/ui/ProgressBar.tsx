import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
    value: number; // 0-100
    max?: number;
    label?: string;
    showValue?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function ProgressBar({
    value,
    max = 100,
    label,
    showValue = true,
    size = 'md',
    className,
}: ProgressBarProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className={`${size !== 'md' ? styles[size] : ''} ${className || ''}`}>
            {(label || showValue) && (
                <div className={styles.label}>
                    {label && <span>{label}</span>}
                    {showValue && <span>{Math.round(percentage)}%</span>}
                </div>
            )}
            <div className={styles.track} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
                <div className={styles.fill} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
}
