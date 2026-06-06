import { isDbReady } from '@/lib/db/db-client';
import { useModals } from '@/context/modal-context';
import { ensureSystemLoanCategories, getLoans, type LoanWithDetails } from '@/lib/db/queries';
import { logger } from '@/lib/logger';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface LoanSummary {
  totalGiven: number;
  totalTaken: number;
  totalGivenSettled: number;
  totalTakenSettled: number;
}

export interface SystemLoanCategoryIds {
  expenseCategoryId: number;
  incomeCategoryId: number;
}

export function useLoans(filter: 'all' | 'given' | 'taken' = 'all') {
  const [loans, setLoans] = useState<LoanWithDetails[]>([]);
  const [summary, setSummary] = useState<LoanSummary>({ totalGiven: 0, totalTaken: 0, totalGivenSettled: 0, totalTakenSettled: 0 });
  const [categoryIds, setCategoryIds] = useState<SystemLoanCategoryIds | null>(null);
  const [loading, setLoading] = useState(true);
  const { refreshSignal } = useModals();
  const mountedRef = useRef(true);
  const categoryIdsInitialized = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async () => {
    if (!isDbReady()) return;
    setLoading(true);
    try {
      // Ensure system loan categories exist once
      if (!categoryIdsInitialized.current) {
        const ids = await ensureSystemLoanCategories();
        if (!mountedRef.current) return;
        setCategoryIds(ids);
        categoryIdsInitialized.current = true;
      }

      const typeFilter = filter === 'all' ? undefined : filter;
      const all = await getLoans(typeFilter ? { type: typeFilter } : undefined);
      if (!mountedRef.current) return;

      setLoans(all);

      // Compute summary from full list (fetch all to get totals regardless of filter)
      const allForSummary = filter === 'all' ? all : await getLoans();
      if (!mountedRef.current) return;

      const totalGiven = allForSummary
        .filter((l) => l.type === 'given' && l.is_settled === 0)
        .reduce((s, l) => s + l.remaining_amount, 0);
      const totalTaken = allForSummary
        .filter((l) => l.type === 'taken' && l.is_settled === 0)
        .reduce((s, l) => s + l.remaining_amount, 0);
      const totalGivenSettled = allForSummary
        .filter((l) => l.type === 'given' && l.is_settled === 1)
        .reduce((s, l) => s + l.amount, 0);
      const totalTakenSettled = allForSummary
        .filter((l) => l.type === 'taken' && l.is_settled === 1)
        .reduce((s, l) => s + l.amount, 0);

      setSummary({ totalGiven, totalTaken, totalGivenSettled, totalTakenSettled });
    } catch (e) {
      logger.error('useLoans: failed to refresh', e);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [filter]);

  // Single effect covers both initial mount and subsequent refreshSignal changes.
  // refresh is stable (useCallback with [filter] dep) so this won't double-fire.
  useEffect(() => {
    refresh();
  }, [refreshSignal, refresh]);

  return { loans, summary, categoryIds, loading, refresh };
}
