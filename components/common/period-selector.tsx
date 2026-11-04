import { useThemeColors } from '@/hooks/use-theme-colors';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, View } from 'react-native';
import { ThemedText } from './themed-text';

export interface SegmentOption<K extends string> {
    key: K;
    label: string;
    /** Spoken label when the visible one is abbreviated ("3M" → "Last 3 months"). */
    accessibilityLabel?: string;
}

interface SegmentedControlProps<K extends string> {
    options: readonly SegmentOption<K>[];
    /** null = nothing selected (e.g. another filter overrides this one). */
    value: K | null;
    onChange: (key: K) => void;
    className?: string;
}

/**
 * Underlined segmented control — the one way to switch a period or a mode
 * across the app (Activity, Budgets, Insights, Export).
 */
export function SegmentedControl<K extends string>({ options, value, onChange, className = '' }: SegmentedControlProps<K>) {
    const colors = useThemeColors();
    return (
        <View
            accessibilityRole="tablist"
            className={`flex-row border-b border-divider dark:border-dark-divider ${className}`}
        >
            {options.map(opt => {
                const active = opt.key === value;
                return (
                    <Pressable
                        key={opt.key}
                        onPress={() => {
                            if (active) return;
                            Haptics.selectionAsync().catch(() => {});
                            onChange(opt.key);
                        }}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={opt.accessibilityLabel ?? opt.label}
                        className="flex-1 items-center justify-center min-h-[44px]"
                    >
                        <ThemedText
                            type="label"
                            style={{ color: active ? colors.textPrimary : colors.textMuted }}
                        >
                            {opt.label}
                        </ThemedText>
                        <View
                            style={{
                                position: 'absolute', bottom: -1, left: 8, right: 8, height: 2,
                                backgroundColor: active ? colors.primary : 'transparent',
                            }}
                        />
                    </Pressable>
                );
            })}
        </View>
    );
}

export type PeriodKey = 'month' | '3months' | '6months' | 'year';

export const PERIOD_SEGMENTS: readonly SegmentOption<PeriodKey>[] = [
    { key: 'month', label: 'Month', accessibilityLabel: 'This month' },
    { key: '3months', label: '3M', accessibilityLabel: 'Last 3 months' },
    { key: '6months', label: '6M', accessibilityLabel: 'Last 6 months' },
    { key: 'year', label: 'Year', accessibilityLabel: 'This year' },
];

export function PeriodSelector({
    value,
    onChange,
    className,
}: {
    value: PeriodKey;
    onChange: (p: PeriodKey) => void;
    className?: string;
}) {
    return <SegmentedControl options={PERIOD_SEGMENTS} value={value} onChange={onChange} className={className} />;
}
