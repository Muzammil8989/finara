import { useThemeColors } from '@/hooks/use-theme-colors';
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ThemedText } from './themed-text';

interface ProgressRingProps {
    /** 0–100; values above 100 draw a full ring. */
    percent: number;
    size?: number;
    stroke?: number;
    color?: string;
    /** Text in the middle; defaults to the rounded percentage. Pass null for none. */
    label?: string | null;
}

export function ProgressRing({ percent, size = 44, stroke = 3, color, label }: ProgressRingProps) {
    const colors = useThemeColors();
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const p = Math.max(0, Math.min(percent, 100));
    const text = label === undefined ? `${Math.round(p)}%` : label;

    return (
        <View
            style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
            accessible
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(p) }}
        >
            <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
                <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.divider} strokeWidth={stroke} fill="none" />
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke={color ?? colors.primary}
                    strokeWidth={stroke}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${c} ${c}`}
                    strokeDashoffset={c * (1 - p / 100)}
                />
            </Svg>
            {text !== null && (
                <ThemedText type="figure" className="text-[11px]" style={{ color: colors.textPrimary }}>
                    {text}
                </ThemedText>
            )}
        </View>
    );
}
