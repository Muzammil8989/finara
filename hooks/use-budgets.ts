import { isDbReady } from '@/lib/db/db-client';
import { getBudgetSpend, getBudgetsWithDetails } from '@/lib/db/queries';
import { logger } from '@/lib/logger';
import { useCallback, useEffect, useRef, useState } from 'react';

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

function getPeriodDateRange(period: string): { startDate: string; endDate: string } {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (period === 'daily') {
        const today = toISO(now);
        return { startDate: today, endDate: today };
    } else if (period === 'weekly') {
        const day = now.getDay();
        const start = new Date(now);
        start.setDate(now.getDate() - day);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { startDate: toISO(start), endDate: toISO(end) };
    } else if (period === 'monthly') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { startDate: toISO(start), endDate: toISO(end) };
    } else {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31);
        return { startDate: toISO(start), endDate: toISO(end) };
    }
}

export function useBudgets() {
    const [budgets, setBudgets] = useState<BudgetWithSpend[]>([]);
    const [loading, setLoading] = useState(true);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const refresh = useCallback(async () => {
        if (!isDbReady()) return;
        setLoading(true);
        try {
            const raw = await getBudgetsWithDetails();
            const withSpend: BudgetWithSpend[] = await Promise.all(
                raw.map(async (b) => {
                    const { startDate, endDate } = getPeriodDateRange(b.period);
                    const spendResult = await getBudgetSpend(b.category_id, startDate, endDate);
                    const spent = Number(spendResult[0]?.total) || 0;
                    const percentUsed = b.amount > 0 ? (spent / b.amount) * 100 : 0;
                    return {
                        id: b.id,
                        amount: b.amount,
                        period: b.period as 'daily' | 'weekly' | 'monthly' | 'yearly',
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
            if (mountedRef.current) setBudgets(withSpend);
        } catch (e) {
            logger.error('Failed to fetch budgets', e);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { budgets, loading, refresh };
}
