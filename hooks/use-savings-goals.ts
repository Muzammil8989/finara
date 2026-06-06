import { isDbReady } from '@/lib/db/db-client';
import { getSavingsGoals } from '@/lib/db/queries';
import { SavingsGoal } from '@/lib/db/schema';
import { logger } from '@/lib/logger';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useSavingsGoals() {
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
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
            const data = await getSavingsGoals();
            if (mountedRef.current) setGoals(data);
        } catch (e) {
            logger.error('Failed to fetch savings goals', e);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { goals, loading, refresh };
}
