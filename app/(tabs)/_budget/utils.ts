import type { AppColorTheme } from '@/theme/colors';

export const PERIOD_LABELS: Record<string, string> = {
    daily: 'Today',
    weekly: 'This Week',
    monthly: 'This Month',
    yearly: 'This Year',
};

export type PeriodFilter = 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export function getProgressColor(
    percent: number,
    colors: Pick<AppColorTheme, 'error' | 'warning' | 'success'>,
): string {
    if (percent >= 90) return colors.error;
    if (percent >= 60) return colors.warning;
    return colors.success;
}
