import React, { HTMLAttributes, forwardRef } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'glow';
    size?: 'sm' | 'md' | 'lg';
    hoverable?: boolean;
    noPadding?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ variant = 'default', size = 'md', hoverable, noPadding, children, className, ...props }, ref) => {
        const classes = [
            styles.card,
            variant !== 'default' && styles[variant],
            size !== 'md' && styles[size],
            hoverable && styles.hoverable,
            noPadding && styles.noPadding,
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div ref={ref} className={classes} {...props}>
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';
export default Card;
