import { isDbReady } from '@/lib/db/db-client';
import { getBudgetSpend, getBudgetsWithDetails } from '@/lib/db/queries';
import { getPeriodDateRange } from '@/lib/utils/date';
import { useModals } from '@/context/modal-context';
import { logger } from '@/lib/logger';
import { useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';

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

export function useBudgets() {
    const [budgets, setBudgets] = useState<BudgetWithSpend[]>([]);
    const [loading, setLoading] = useState(true);
    const mountedRef = useRef(true);
    const { refreshSignal } = useModals();

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

    // Defer until interactions/animations finish so the skeleton stays stable
    // through the tab transition instead of flipping to content mid-slide.
    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => refresh());
        return () => task.cancel();
    }, [refresh, refreshSignal]);

    return { budgets, loading, refresh };
}
