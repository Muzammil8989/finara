import { useCallback, useEffect, useRef, useState } from 'react';
import { getCategories } from '@/lib/db/queries';
import { isDbReady } from '@/lib/db/db-client';
import { logger } from '@/lib/logger';

export interface Category {
    id: number;
    name: string;
    type: 'income' | 'expense';
    payment_method?: string;
    icon?: string;
    color?: string;
}

export function useCategories(type?: 'income' | 'expense') {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const fetchCategories = useCallback(async () => {
        if (!isDbReady()) return;
        try {
            setLoading(true);
            setError(null);

            const result = await getCategories(type);

            if (!mountedRef.current) return;

            const mappedCategories: Category[] = result.map((c) => ({
                id: c.id,
                name: c.name,
                type: c.type as 'income' | 'expense',
                payment_method: c.payment_method || undefined,
                icon: c.icon || undefined,
                color: c.color || undefined,
            }));

            setCategories(mappedCategories);
        } catch (e) {
            logger.error('Failed to fetch categories', e);
            if (mountedRef.current) {
                setError(e instanceof Error ? e : new Error('Failed to fetch categories'));
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [type]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return { categories, loading, error, refresh: fetchCategories };
}
