import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', fullWidth, isLoading, children, className, disabled, ...props }, ref) => {
        const classes = [
            styles.button,
            styles[variant],
            size !== 'md' && styles[size],
            fullWidth && styles.fullWidth,
            isLoading && styles.loading,
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <button ref={ref} className={classes} disabled={disabled || isLoading} {...props}>
                {isLoading && <span className={styles.spinner} />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
export default Button;
