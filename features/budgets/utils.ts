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

type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

/** How many of each period fit in an average month. */
const PER_MONTH: Record<BudgetPeriod, number> = {
    daily: 365 / 12,
    weekly: 52 / 12,
    monthly: 1,
    yearly: 1 / 12,
};

export interface BudgetSummary {
    totalBudgeted: number;
    totalSpent: number;
    /** Not capped: 120 means 20% over budget. */
    overallPercent: number;
    /** True when budgets of different periods were converted to monthly amounts. */
    isMonthlyEquivalent: boolean;
}

/**
 * Header totals for a list of budgets. Budgets of one period are summed as-is.
 * Mixed periods (the "All" filter) can't be added directly — a daily $20 and a
 * monthly $500 are different units — so each is converted to its monthly
 * equivalent first.
 */
export function summarizeBudgets(budgets: { amount: number; spent: number; period: string }[]): BudgetSummary {
    const periods = new Set(budgets.map(b => b.period));
    const isMonthlyEquivalent = periods.size > 1;
    const factor = (p: string) => (isMonthlyEquivalent ? PER_MONTH[p as BudgetPeriod] ?? 1 : 1);

    const totalBudgeted = budgets.reduce((s, b) => s + b.amount * factor(b.period), 0);
    const totalSpent = budgets.reduce((s, b) => s + b.spent * factor(b.period), 0);
    return {
        totalBudgeted,
        totalSpent,
        overallPercent: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
        isMonthlyEquivalent,
    };
}

export type BudgetTone = 'ok' | 'near' | 'over';

/**
 * Plain-language status for a budget: over once spending passes the limit,
 * near once it crosses the budget's own alert threshold, otherwise on track.
 */
export function getBudgetStatus(percentUsed: number, alertThreshold = 80): { tone: BudgetTone } {
    if (percentUsed > 100) return { tone: 'over' };
    if (percentUsed >= alertThreshold) return { tone: 'near' };
    return { tone: 'ok' };
}
