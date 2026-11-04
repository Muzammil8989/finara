import type { PeriodKey } from '@/components/common/period-selector';
import tokens from '@/theme/tokens';
import { useContentWidth } from '@/hooks/use-content-width';

/** Chart width for the content column (updates on rotation / resize). */
export function useChartWidth(): number {
    return useContentWidth() - 32;
}

/** Editorial categorical palette (see theme/tokens.js). */
export const DEFAULT_COLORS: string[] = tokens.chartCategorical;

export type PeriodFilter = PeriodKey;

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

export interface DonutSlice {
    key: string;
    label: string;
    value: number;
    color: string;
    percent: number;
}

export const OTHER_COLOR = '#B3AA9C';

/**
 * Slices for the category donut AND its legend, so both show the same
 * categories: at most `maxSlices` slices, the last being "Other" for the rest.
 * Percentages are of the full total, which equals the sum of the slices.
 */
export function buildDonutSlices(
    data: { categoryId: number; categoryName: string; categoryColor: string | null; total: number }[],
    maxSlices = 5,
): { slices: DonutSlice[]; total: number } {
    const total = data.reduce((s, c) => s + c.total, 0);
    const sorted = [...data].sort((a, b) => b.total - a.total);
    const top = sorted.length > maxSlices ? sorted.slice(0, maxSlices - 1) : sorted;
    const rest = sorted.slice(top.length);

    const slices: DonutSlice[] = top.map((c, i) => ({
        key: String(c.categoryId),
        label: c.categoryName,
        value: c.total,
        color: c.categoryColor || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        percent: 0,
    }));
    if (rest.length) {
        slices.push({ key: 'other', label: 'Other', value: rest.reduce((s, c) => s + c.total, 0), color: OTHER_COLOR, percent: 0 });
    }
    for (const slice of slices) slice.percent = total > 0 ? Math.round((slice.value / total) * 100) : 0;
    return { slices, total };
}

export const PERIOD_PHRASE: Record<PeriodFilter, string> = {
    month: 'this month',
    '3months': 'over the last 3 months',
    '6months': 'over the last 6 months',
    year: 'this year',
};

/**
 * One plain-English paragraph that leads the Insights page, e.g.
 * "You spent $2,910.00 this month — 31% less than came in. Groceries took
 *  the largest share at 28%."
 */
export function buildStandfirst(opts: {
    period: PeriodFilter;
    income: number;
    expense: number;
    topCategory?: { name: string; percent: number } | null;
    format: (n: number) => string;
}): string {
    const { period, income, expense, topCategory, format } = opts;
    const when = PERIOD_PHRASE[period];
    if (income === 0 && expense === 0) return `Nothing recorded ${when} yet.`;

    let lead: string;
    if (income === 0) {
        lead = `You spent ${format(expense)} ${when}, with no income recorded.`;
    } else if (expense === 0) {
        lead = `${format(income)} came in ${when} and nothing went out.`;
    } else if (expense <= income) {
        const pct = Math.round(((income - expense) / income) * 100);
        lead = pct === 0
            ? `You spent ${format(expense)} ${when} — exactly what came in.`
            : `You spent ${format(expense)} ${when} — ${pct}% less than came in.`;
    } else {
        lead = `You spent ${format(expense)} ${when} — ${format(expense - income)} more than came in.`;
    }

    const tail = topCategory && topCategory.percent > 0
        ? ` ${topCategory.name} took the largest share at ${topCategory.percent}%.`
        : '';
    return lead + tail;
}
