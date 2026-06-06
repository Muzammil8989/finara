import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCategories } from '@/hooks/use-categories';

jest.mock('@/lib/db/db-client', () => ({
    getDb: jest.fn(),
    isDbReady: jest.fn(() => true),
}));

jest.mock('@/lib/db/queries', () => ({
    getCategories: jest.fn(),
}));

import { getCategories } from '@/lib/db/queries';
import { isDbReady } from '@/lib/db/db-client';

const mockGetCategories = getCategories as jest.Mock;
const mockIsDbReady = isDbReady as jest.Mock;

const RAW_CATEGORIES = [
    { id: 1, name: 'Food', type: 'expense', icon: 'fast-food', color: '#FF5733', payment_method: null },
    { id: 2, name: 'Salary', type: 'income', icon: 'cash', color: '#10B981', payment_method: 'bank' },
];

beforeEach(() => {
    jest.clearAllMocks();
    mockIsDbReady.mockReturnValue(true);
    mockGetCategories.mockResolvedValue(RAW_CATEGORIES);
});

describe('useCategories', () => {
    it('starts in loading state', () => {
        const { result } = renderHook(() => useCategories());
        expect(result.current.loading).toBe(true);
    });

    it('loads all categories when no type filter', async () => {
        const { result } = renderHook(() => useCategories());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.categories).toHaveLength(2);
        expect(result.current.error).toBeNull();
        expect(mockGetCategories).toHaveBeenCalledWith(undefined);
    });

    it('passes type filter to getCategories', async () => {
        mockGetCategories.mockResolvedValue([RAW_CATEGORIES[0]]);
        const { result } = renderHook(() => useCategories('expense'));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(mockGetCategories).toHaveBeenCalledWith('expense');
        expect(result.current.categories).toHaveLength(1);
        expect(result.current.categories[0].type).toBe('expense');
    });

    it('maps null payment_method to undefined', async () => {
        const { result } = renderHook(() => useCategories());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.categories[0].payment_method).toBeUndefined();
    });

    it('maps non-null payment_method correctly', async () => {
        const { result } = renderHook(() => useCategories());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.categories[1].payment_method).toBe('bank');
    });

    it('does nothing when db is not ready', async () => {
        mockIsDbReady.mockReturnValue(false);

        const { result } = renderHook(() => useCategories());

        await waitFor(() => expect(mockGetCategories).not.toHaveBeenCalled());
        expect(result.current.categories).toEqual([]);
    });

    it('sets error on fetch failure', async () => {
        const err = new Error('Query failed');
        mockGetCategories.mockRejectedValue(err);

        const { result } = renderHook(() => useCategories());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toEqual(err);
        expect(result.current.categories).toEqual([]);
    });

    it('wraps non-Error throws into an Error', async () => {
        mockGetCategories.mockRejectedValue('oops');

        const { result } = renderHook(() => useCategories());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('Failed to fetch categories');
    });

    it('exposes a refresh function', async () => {
        const { result } = renderHook(() => useCategories());
        await waitFor(() => expect(result.current.loading).toBe(false));

        const newCategories = [{ id: 3, name: 'Transport', type: 'expense', icon: 'car', color: '#246BFD', payment_method: null }];
        mockGetCategories.mockResolvedValue(newCategories);

        await act(async () => {
            await result.current.refresh();
        });

        expect(result.current.categories).toHaveLength(1);
        expect(result.current.categories[0].name).toBe('Transport');
    });

    it('re-fetches when type filter changes', async () => {
        const { result, rerender } = renderHook(
            ({ type }: { type?: 'income' | 'expense' }) => useCategories(type),
            { initialProps: { type: undefined as 'income' | 'expense' | undefined } }
        );

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(mockGetCategories).toHaveBeenCalledWith(undefined);

        mockGetCategories.mockResolvedValue([RAW_CATEGORIES[1]]);
        rerender({ type: 'income' });

        await waitFor(() => {
            expect(mockGetCategories).toHaveBeenCalledWith('income');
            expect(result.current.categories[0]?.type).toBe('income');
        });
    });
});
