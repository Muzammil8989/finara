import { getBudgetsWithDetails, getSpendByCategory } from '@/lib/db/queries';
import { getPeriodDateRange } from '@/lib/utils/date';

export interface BudgetWithSpend {
    id: number;
    amount: number;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    category_id: number | null;
    categoryName: string | null;
    categoryIcon: string | null;
    categoryColor: string | null;
    alert_threshold: number | null;
    spent: number;
    percentUsed: number;
    remaining: number;
}

type PeriodRange = { startDate: string; endDate: string };
type PeriodSpend = Awaited<ReturnType<typeof getSpendByCategory>>;

const rangeKey = (r: PeriodRange) => `${r.startDate}|${r.endDate}`;

/**
 * Spend for each distinct period range: one grouped query per range (at most
 * four: daily/weekly/monthly/yearly) instead of one query per budget.
 * Returns a lookup giving what was spent against a budget in its range.
 */
export async function loadSpendByRange(ranges: PeriodRange[]) {
    const unique = new Map(ranges.map(r => [rangeKey(r), r]));
    const entries = await Promise.all(
        [...unique].map(async ([key, r]) => [key, await getSpendByCategory(r.startDate, r.endDate)] as const)
    );
    const byRange = new Map<string, PeriodSpend>(entries);
    /** Its category's total, or every category's when the budget has none. */
    return (range: PeriodRange, categoryId: number | null): number => {
        const spend = byRange.get(rangeKey(range));
        if (!spend) return 0;
        return categoryId === null ? spend.total : spend.byCategory.get(categoryId) ?? 0;
    };
}

/** Every budget with what has been spent against it in its current period. */
export async function loadBudgetsWithSpend(): Promise<BudgetWithSpend[]> {
    const raw = await getBudgetsWithDetails();
    const ranges = raw.map(b => getPeriodDateRange(b.period));
    const spentIn = await loadSpendByRange(ranges);
    return raw.map((b, i) => {
        const spent = spentIn(ranges[i], b.category_id);
        const percentUsed = b.amount > 0 ? (spent / b.amount) * 100 : 0;
        return {
            id: b.id,
            amount: b.amount,
            period: b.period as BudgetWithSpend['period'],
            category_id: b.category_id,
            categoryName: b.categoryName,
            categoryIcon: b.categoryIcon,
            categoryColor: b.categoryColor,
            alert_threshold: b.alert_threshold,
            spent,
            percentUsed,
            remaining: b.amount - spent,
        };
    });
}
