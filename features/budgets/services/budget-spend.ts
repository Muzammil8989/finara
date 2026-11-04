import { getBudgetSpend, getBudgetsWithDetails } from '@/lib/db/queries';
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

/** Every budget with what has been spent against it in its current period. */
export async function loadBudgetsWithSpend(): Promise<BudgetWithSpend[]> {
    const raw = await getBudgetsWithDetails();
    return Promise.all(
        raw.map(async (b) => {
            const { startDate, endDate } = getPeriodDateRange(b.period);
            const spendResult = await getBudgetSpend(b.category_id, startDate, endDate);
            const spent = Number(spendResult[0]?.total) || 0;
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
        })
    );
}
