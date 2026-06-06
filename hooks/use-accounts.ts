import { Account, ensureDefaultAccount, getAccountsWithBalance } from '@/lib/db/queries';
import { isDbReady } from '@/lib/db/db-client';
import { useModals } from '@/context/modal-context';
import { logger } from '@/lib/logger';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useAccounts() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const mountedRef = useRef(true);
    const { refreshSignal } = useModals();

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const refresh = useCallback(async () => {
        if (!isDbReady()) return;
        setIsLoading(true);
        try {
            await ensureDefaultAccount();
            const data = await getAccountsWithBalance();
            if (mountedRef.current) {
                setAccounts(data);
                setError(null);
            }
        } catch (err) {
            logger.error('Error fetching accounts:', err);
            if (mountedRef.current) {
                setError(err instanceof Error ? err : new Error('Failed to fetch accounts'));
            }
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => { refresh(); }, [refreshSignal, refresh]);

    return {
        accounts,
        isLoading,
        error,
        refresh,
    };
}
