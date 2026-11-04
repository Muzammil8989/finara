import { useThemeColors } from '@/hooks/use-theme-colors';
import React from 'react';
import { View } from 'react-native';
import { ThemedText } from './themed-text';

interface StatFigureProps {
    label: string;
    value: string;
    /** Percentage change; sign decides the ▲/▼ glyph. */
    delta?: number | null;
    /** Text after the delta, e.g. "vs last month". */
    deltaCaption?: string;
    /** When true, a rise is bad (spending) so ▲ is drawn in the expense colour. */
    invertDelta?: boolean;
    size?: 'lg' | 'md' | 'sm';
    /** Colour for the value itself (e.g. income/expense). Defaults to ink. */
    valueColor?: string;
    align?: 'left' | 'right';
}

/**
 * Label + big tabular number + optional delta. Direction is carried by the
 * glyph and the words, never by colour alone.
 */
export function StatFigure({
    label,
    value,
    delta,
    deltaCaption,
    invertDelta = false,
    size = 'md',
    valueColor,
    align = 'left',
}: StatFigureProps) {
    const colors = useThemeColors();

    const valueClass =
        size === 'lg' ? 'text-[38px] leading-[44px] tracking-[-0.8px]' :
        size === 'md' ? 'text-[22px] leading-7' :
                        'text-base';

    const hasDelta = delta != null && Number.isFinite(delta);
    const up = hasDelta && (delta as number) > 0;
    const flat = hasDelta && Math.abs(delta as number) < 0.05;
    const good = invertDelta ? !up : up;
    const deltaColor = flat ? colors.textMuted : good ? colors.income : colors.expense;
    const glyph = flat ? '–' : up ? '▲' : '▼';

    const a11y = `${label}: ${value}${hasDelta ? `, ${flat ? 'unchanged' : `${up ? 'up' : 'down'} ${Math.abs(delta as number).toFixed(1)} percent`}${deltaCaption ? ` ${deltaCaption}` : ''}` : ''}`;

    return (
        <View accessible accessibilityLabel={a11y} style={{ alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
            <ThemedText type="kicker" className="mb-1">{label}</ThemedText>
            <ThemedText
                type={size === 'lg' ? 'figureLg' : 'figure'}
                className={valueClass}
                style={valueColor ? { color: valueColor } : undefined}
                numberOfLines={1}
                adjustsFontSizeToFit
            >
                {value}
            </ThemedText>
            {hasDelta && (
                <View className="flex-row items-center mt-1">
                    <ThemedText type="figure" className="text-xs" style={{ color: deltaColor }}>
                        {glyph} {Math.abs(delta as number).toFixed(1)}%
                    </ThemedText>
                    {!!deltaCaption && <ThemedText type="caption" className="ml-1.5">{deltaCaption}</ThemedText>}
                </View>
            )}
        </View>
    );
}
