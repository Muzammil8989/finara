import { useThemeColors } from '@/hooks/use-theme-colors';
import { fonts } from '@/theme/typography';
import { useMemo } from 'react';

/**
 * One visual system for every chart: hairline grids, muted axis text in the
 * UI sans, tabular figures, income green / spending clay, and a muted
 * categorical set. No gradients, no 3D, no default library colours.
 */
export function useChartTheme() {
    const colors = useThemeColors();
    return useMemo(() => ({
        income: colors.chartIncome,
        expense: colors.chartExpense,
        accent: colors.primary,
        grid: colors.chartGrid,
        axis: colors.chartAxis,
        ink: colors.textPrimary,
        muted: colors.textMuted,
        surface: colors.surface,
        background: colors.background,
        categorical: colors.chartCategorical as string[],
        axisText: { color: colors.chartAxis, fontSize: 10, fontFamily: fonts.sansMedium },
        valueText: { color: colors.textPrimary, fontSize: 10, fontFamily: fonts.figure },
    }), [colors]);
}

export type ChartTheme = ReturnType<typeof useChartTheme>;

/** "$1.2k" style label for axis ticks and bar tops. */
export function compactMoney(value: number, symbol = '$'): string {
    const abs = Math.abs(value);
    const sign = value < 0 ? '−' : '';
    if (abs >= 1_000_000) return `${sign}${symbol}${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}m`;
    if (abs >= 1_000) return `${sign}${symbol}${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
    return `${sign}${symbol}${Math.round(abs)}`;
}

/** A "nice" axis maximum (1, 2, 2.5, 5 × 10ⁿ) at or above `max`. */
export function niceMax(max: number): number {
    if (max <= 0) return 1;
    const exp = Math.pow(10, Math.floor(Math.log10(max)));
    for (const m of [1, 2, 2.5, 5, 10]) {
        if (m * exp >= max) return m * exp;
    }
    return 10 * exp;
}
