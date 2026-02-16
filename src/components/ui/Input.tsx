import React, { InputHTMLAttributes, forwardRef } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    inputSize?: 'md' | 'lg';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, inputSize = 'md', className, ...props }, ref) => {
        const inputClasses = [
            styles.input,
            error && styles.error,
            inputSize === 'lg' && styles.lg,
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div className={styles.inputWrapper}>
                {label && <label className={styles.label}>{label}</label>}
                <input ref={ref} className={inputClasses} {...props} />
                {error && <span className={styles.errorText}>{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
export default Input;
