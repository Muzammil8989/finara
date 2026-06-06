import { Dimensions } from 'react-native';

export const SCREEN_WIDTH = Dimensions.get('window').width;
export const CHART_WIDTH = SCREEN_WIDTH - 32;

export const DEFAULT_COLORS = [
    '#246BFD', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#14B8A6',
];

export type PeriodFilter = 'month' | '3months' | '6months' | 'year';

export const PERIOD_OPTIONS: { key: PeriodFilter; label: string }[] = [
    { key: 'month',   label: 'This Month' },
    { key: '3months', label: 'Last 3 Months' },
    { key: '6months', label: 'Last 6 Months' },
    { key: 'year',    label: 'This Year' },
];

export function getDateRange(period: PeriodFilter): { start: string; end: string; months: number } {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (period === 'month') {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        const last  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { start: fmt(first), end: fmt(last), months: 1 };
    }
    if (period === '3months') {
        const first = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const last  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { start: fmt(first), end: fmt(last), months: 3 };
    }
    if (period === '6months') {
        const first = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const last  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { start: fmt(first), end: fmt(last), months: 6 };
    }
    const first = new Date(now.getFullYear(), 0, 1);
    const last  = new Date(now.getFullYear(), 11, 31);
    return { start: fmt(first), end: fmt(last), months: 12 };
}
