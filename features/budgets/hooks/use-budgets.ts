import { isDbReady } from '@/lib/db/db-client';
import { loadBudgetsWithSpend, type BudgetWithSpend } from '../services/budget-spend';
import { useRefreshSignal, type RefreshDomain } from '@/providers/modal-context';
import { logger } from '@/lib/logger';
import { useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';

export type { BudgetWithSpend };

// Spend comes from transactions; names/icons from categories.
const REFRESH_DOMAINS: readonly RefreshDomain[] = ['budgets', 'transactions', 'categories'];

export function useBudgets() {
    const [budgets, setBudgets] = useState<BudgetWithSpend[]>([]);
    const [loading, setLoading] = useState(true);
    const mountedRef = useRef(true);
    const refreshSignal = useRefreshSignal(REFRESH_DOMAINS);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const refresh = useCallback(async () => {
        if (!isDbReady()) return;
        setLoading(true);
        try {
            const withSpend = await loadBudgetsWithSpend();
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
