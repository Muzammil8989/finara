import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAccounts } from '@/features/accounts/hooks/use-accounts';

// Override global db-client mock to include isDbReady
jest.mock('@/lib/db/db-client', () => ({
    getDb: jest.fn(),
    isDbReady: jest.fn(() => true),
}));

jest.mock('@/lib/db/queries', () => ({
    ensureDefaultAccount: jest.fn(),
    getAccountsWithBalance: jest.fn(),
}));

jest.mock('@/providers/modal-context', () => ({
    useModals: jest.fn(() => ({
        refreshSignal: 0,
        openModal: jest.fn(),
        closeModal: jest.fn(),
    })),
}));

import { ensureDefaultAccount, getAccountsWithBalance } from '@/lib/db/queries';
import { isDbReady } from '@/lib/db/db-client';
import { useModals } from '@/providers/modal-context';

const mockEnsureDefault = ensureDefaultAccount as jest.Mock;
const mockGetAccounts = getAccountsWithBalance as jest.Mock;
const mockIsDbReady = isDbReady as jest.Mock;
const mockUseModals = useModals as jest.Mock;

const MOCK_ACCOUNTS = [
    { id: 1, name: 'Cash', type: 'cash', balance: 500 },
    { id: 2, name: 'Bank', type: 'checking', balance: 2000 },
];

beforeEach(() => {
    jest.clearAllMocks();
    mockIsDbReady.mockReturnValue(true);
    mockEnsureDefault.mockResolvedValue(undefined);
    mockGetAccounts.mockResolvedValue(MOCK_ACCOUNTS);
    mockUseModals.mockReturnValue({ refreshSignal: 0, openModal: jest.fn(), closeModal: jest.fn() });
});

describe('useAccounts', () => {
    it('starts in loading state', () => {
        const { result } = renderHook(() => useAccounts());
        expect(result.current.isLoading).toBe(true);
    });

    it('loads accounts on mount', async () => {
        const { result } = renderHook(() => useAccounts());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.accounts).toEqual(MOCK_ACCOUNTS);
        expect(result.current.error).toBeNull();
        // One fetch on mount (the legacy hook fetched twice).
        expect(mockEnsureDefault).toHaveBeenCalledTimes(1);
        expect(mockGetAccounts).toHaveBeenCalledTimes(1);
    });

    it('does nothing when db is not ready', async () => {
        mockIsDbReady.mockReturnValue(false);

        const { result } = renderHook(() => useAccounts());

        // isLoading stays true since refresh() returned early
        await waitFor(() => expect(mockGetAccounts).not.toHaveBeenCalled());
        expect(result.current.accounts).toEqual([]);
    });

    it('sets error on fetch failure', async () => {
        const err = new Error('DB error');
        mockGetAccounts.mockRejectedValue(err);

        const { result } = renderHook(() => useAccounts());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toEqual(err);
        expect(result.current.accounts).toEqual([]);
    });

    it('wraps non-Error throws into an Error', async () => {
        mockGetAccounts.mockRejectedValue('string error');

        const { result } = renderHook(() => useAccounts());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('Failed to fetch accounts');
    });

    it('re-fetches when refreshSignal changes', async () => {
        let signal = 0;
        mockUseModals.mockImplementation(() => ({
            refreshSignal: signal,
            openModal: jest.fn(),
            closeModal: jest.fn(),
        }));

        const { result, rerender } = renderHook(() => useAccounts());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        // 2 calls on mount (two useEffects)
        const callsAfterMount = mockGetAccounts.mock.calls.length;

        signal = 1;
        mockUseModals.mockReturnValue({ refreshSignal: 1, openModal: jest.fn(), closeModal: jest.fn() });
        rerender({});

        await waitFor(() => expect(mockGetAccounts).toHaveBeenCalledTimes(callsAfterMount + 1));
    });

    it('exposes a refresh function that re-loads accounts', async () => {
        const { result } = renderHook(() => useAccounts());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const updatedAccounts = [...MOCK_ACCOUNTS, { id: 3, name: 'Savings', type: 'savings', balance: 1000 }];
        mockGetAccounts.mockResolvedValue(updatedAccounts);

        await act(async () => {
            await result.current.refresh();
        });

        expect(result.current.accounts).toEqual(updatedAccounts);
    });
});
