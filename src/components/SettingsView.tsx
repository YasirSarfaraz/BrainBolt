'use client';

import React, { useState, useEffect } from 'react';
import { useConfig } from '@/context/ConfigContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from './SettingsView.module.css';

interface ConfigField {
    key: string;
    label: string;
    category: string;
    type: 'text' | 'number' | 'boolean' | 'json';
    value: any;
}

export default function SettingsView() {
    const { config, refreshConfig } = useConfig();
    const [fields, setFields] = useState<ConfigField[]>([]);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [activeCategory, setActiveCategory] = useState<string>('ui');

    useEffect(() => {
        // Convert config object to editable fields
        const configFields: ConfigField[] = [];

        // UI Category
        configFields.push(
            { key: 'app_title', label: 'App Title', category: 'ui', type: 'text', value: config.ui.app_title },
            { key: 'app_subtitle', label: 'App Subtitle', category: 'ui', type: 'text', value: config.ui.app_subtitle },
            { key: 'app_logo_emoji', label: 'Logo Emoji', category: 'ui', type: 'text', value: config.ui.app_logo_emoji },
            { key: 'difficulty_labels', label: 'Difficulty Labels', category: 'ui', type: 'json', value: config.ui.difficulty_labels },
            { key: 'categories', label: 'Categories', category: 'ui', type: 'json', value: config.ui.categories },
        );

        // Leaderboard Category
        configFields.push(
            { key: 'leaderboard_size', label: 'Leaderboard Size', category: 'leaderboard', type: 'number', value: config.leaderboard.leaderboard_size },
            { key: 'leaderboard_refresh_interval', label: 'Refresh Interval (ms)', category: 'leaderboard', type: 'number', value: config.leaderboard.leaderboard_refresh_interval },
        );

        // Scoring Category
        configFields.push(
            { key: 'scoring_base_multiplier', label: 'Base Multiplier', category: 'scoring', type: 'number', value: config.scoring.scoring_base_multiplier },
            { key: 'scoring_streak_increment', label: 'Streak Increment', category: 'scoring', type: 'number', value: config.scoring.scoring_streak_increment },
            { key: 'scoring_max_streak_multiplier', label: 'Max Streak Multiplier', category: 'scoring', type: 'number', value: config.scoring.scoring_max_streak_multiplier },
        );

        // Adaptive Category
        configFields.push(
            { key: 'momentum_increase', label: 'Momentum Increase', category: 'adaptive', type: 'number', value: config.adaptive.momentum_increase },
            { key: 'momentum_decrease', label: 'Momentum Decrease', category: 'adaptive', type: 'number', value: config.adaptive.momentum_decrease },
            { key: 'momentum_threshold', label: 'Momentum Threshold', category: 'adaptive', type: 'number', value: config.adaptive.momentum_threshold },
            { key: 'min_streak_to_increase', label: 'Min Streak to Increase', category: 'adaptive', type: 'number', value: config.adaptive.min_streak_to_increase },
            { key: 'inactivity_timeout_min', label: 'Inactivity Timeout (min)', category: 'adaptive', type: 'number', value: config.adaptive.inactivity_timeout_min },
        );

        // Features Category
        configFields.push(
            { key: 'enable_gemini', label: 'Enable Gemini AI', category: 'features', type: 'boolean', value: config.features.enable_gemini },
            { key: 'enable_leaderboard', label: 'Enable Leaderboard', category: 'features', type: 'boolean', value: config.features.enable_leaderboard },
            { key: 'enable_metrics', label: 'Enable Metrics', category: 'features', type: 'boolean', value: config.features.enable_metrics },
            { key: 'enable_dark_mode', label: 'Enable Dark Mode', category: 'features', type: 'boolean', value: config.features.enable_dark_mode },
        );

        setFields(configFields);
    }, [config]);

    const handleFieldChange = (key: string, value: any) => {
        setFields(prev => prev.map(field =>
            field.key === key ? { ...field, value } : field
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveStatus('idle');

        try {
            // Convert fields back to config structure
            const updates = fields.map(field => ({
                key: field.key,
                value: field.value,
                category: field.category,
                label: field.label,
            }));

            const response = await fetch('/api/v1/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ configs: updates }),
            });

            if (!response.ok) throw new Error('Failed to save config');

            setSaveStatus('success');
            // Refresh config in context
            await refreshConfig();

            // Clear success message after 3 seconds
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            console.error('Failed to save config:', error);
            setSaveStatus('error');
        } finally {
            setSaving(false);
        }
    };

    const categories = [
        { id: 'ui', label: 'UI Settings', icon: '🎨' },
        { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
        { id: 'scoring', label: 'Scoring', icon: '🎯' },
        { id: 'adaptive', label: 'Adaptive', icon: '📈' },
        { id: 'features', label: 'Features', icon: '⚙️' },
    ];

    const currentFields = fields.filter(f => f.category === activeCategory);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>⚙️ Settings</h1>
                    <p className={styles.subtitle}>Configure your application settings</p>
                </div>
                <div className={styles.actions}>
                    {saveStatus === 'success' && (
                        <span className={styles.successMessage}>✓ Saved successfully!</span>
                    )}
                    {saveStatus === 'error' && (
                        <span className={styles.errorMessage}>✗ Failed to save</span>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        variant="primary"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.sidebar}>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`${styles.categoryBtn} ${activeCategory === cat.id ? styles.categoryBtnActive : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            <span className={styles.categoryIcon}>{cat.icon}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className={styles.main}>
                    <Card>
                        <div className={styles.fields}>
                            {currentFields.map(field => (
                                <div key={field.key} className={styles.field}>
                                    <label className={styles.fieldLabel}>
                                        {field.label}
                                    </label>

                                    {field.type === 'text' && (
                                        <Input
                                            value={field.value as string}
                                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                            placeholder={field.label}
                                        />
                                    )}

                                    {field.type === 'number' && (
                                        <Input
                                            type="number"
                                            value={field.value as number}
                                            onChange={(e) => handleFieldChange(field.key, parseFloat(e.target.value))}
                                            placeholder={field.label}
                                            step="any"
                                        />
                                    )}

                                    {field.type === 'boolean' && (
                                        <label className={styles.checkbox}>
                                            <input
                                                type="checkbox"
                                                checked={field.value as boolean}
                                                onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                                            />
                                            <span>{field.value ? 'Enabled' : 'Disabled'}</span>
                                        </label>
                                    )}

                                    {field.type === 'json' && (
                                        <textarea
                                            className={styles.textarea}
                                            value={JSON.stringify(field.value, null, 2)}
                                            onChange={(e) => {
                                                try {
                                                    const parsed = JSON.parse(e.target.value);
                                                    handleFieldChange(field.key, parsed);
                                                } catch (err) {
                                                    // Keep invalid JSON in text area but don't update field
                                                }
                                            }}
                                            rows={6}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
