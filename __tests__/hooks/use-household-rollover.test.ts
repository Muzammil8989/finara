import { renderHook, waitFor } from '@testing-library/react-native';

jest.mock('@/lib/db/db-client', () => ({
    getDb: jest.fn(),
    isDbReady: jest.fn(() => true),
}));

jest.mock('@/lib/db/queries', () => ({
    archiveHouseholdPeriod: jest.fn(),
    clearHouseholdExpensesByRange: jest.fn(),
    getHouseholdConfig: jest.fn(),
    getHouseholdExpenses: jest.fn(),
    resetHouseholdPeriod: jest.fn(),
}));

import { useHousehold } from '@/features/household/hooks/use-household';
import {
    archiveHouseholdPeriod,
    clearHouseholdExpensesByRange,
    getHouseholdConfig,
    getHouseholdExpenses,
    resetHouseholdPeriod,
} from '@/lib/db/queries';

const mockGetConfig = getHouseholdConfig as jest.Mock;
const mockGetExpenses = getHouseholdExpenses as jest.Mock;
const mockArchive = archiveHouseholdPeriod as jest.Mock;
const mockClear = clearHouseholdExpensesByRange as jest.Mock;
const mockReset = resetHouseholdPeriod as jest.Mock;

const ORIGINAL_DATE = global.Date;

function freezeDate(iso: string) {
    const fixed = new ORIGINAL_DATE(iso);
    class FrozenDate extends ORIGINAL_DATE {
        constructor(...args: unknown[]) {
            if (args.length === 0) {
                super(fixed.getTime());
            } else {
                super(...(args as [number, number, number]));
            }
        }
        static now() {
            return fixed.getTime();
        }
    }
    // @ts-expect-error replacing global
    global.Date = FrozenDate;
}

function restoreDate() {
    global.Date = ORIGINAL_DATE;
}

function makeConfig(
    period_start_date: string,
    period: 'monthly' | 'weekly' | 'yearly' = 'monthly',
    anchorDay?: number,
) {
    return {
        id: 1,
        income_amount: 1000,
        period,
        period_start_date,
        anchor_day: anchorDay ?? parseInt(period_start_date.slice(8, 10), 10),
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
    };
}

beforeEach(() => {
    jest.clearAllMocks();
    mockArchive.mockResolvedValue(undefined);
    mockClear.mockResolvedValue(undefined);
    mockReset.mockImplementation(async (_newStart: string) => undefined);
});

afterEach(() => {
    restoreDate();
});

describe('useHousehold — auto-archive rollover', () => {
    it('does NOT archive when current cycle is still active', async () => {
        freezeDate('2026-06-25T12:00:00.000Z');
        mockGetConfig.mockResolvedValue(makeConfig('2026-06-18', 'monthly'));
        mockGetExpenses.mockResolvedValue([{ id: 1, amount: 100, date: '2026-06-20' }]);

        const { result } = renderHook(() => useHousehold());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(mockArchive).not.toHaveBeenCalled();
        expect(mockClear).not.toHaveBeenCalled();
        expect(mockReset).not.toHaveBeenCalled();
        expect(result.current.summary).toEqual({ income: 1000, spent: 100, remaining: 900 });
        expect(result.current.periodRange.start).toBe('2026-06-18');
        expect(result.current.periodRange.end).toBe('2026-07-17');
    });

    it('archives a finished cycle, clears its expenses, and rolls forward', async () => {
        // "Today" is well past the cycle end (Jun 18 → Jul 17). User reopens app on Jul 20.
        freezeDate('2026-07-20T12:00:00.000Z');
        mockGetConfig.mockResolvedValue(makeConfig('2026-06-18', 'monthly'));
        // First call: expenses inside the elapsed cycle (Jun 18 – Jul 17). Second call: current cycle (Jul 18 – Aug 17).
        mockGetExpenses
            .mockResolvedValueOnce([
                { id: 1, amount: 300, date: '2026-06-25' },
                { id: 2, amount: 200, date: '2026-07-10' },
            ])
            .mockResolvedValueOnce([]);

        const { result } = renderHook(() => useHousehold());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(mockArchive).toHaveBeenCalledTimes(1);
        expect(mockArchive).toHaveBeenCalledWith({
            period: 'monthly',
            start_date: '2026-06-18',
            end_date: '2026-07-17',
            income_amount: 1000,
            spent_amount: 500,
            remaining_amount: 500,
            expense_count: 2,
        });
        expect(mockClear).toHaveBeenCalledWith('2026-06-18', '2026-07-17');
        expect(mockReset).toHaveBeenCalledWith('2026-07-18');

        // After rollover the visible period is the new one
        expect(result.current.periodRange.start).toBe('2026-07-18');
        expect(result.current.periodRange.end).toBe('2026-08-17');
        expect(result.current.summary).toEqual({ income: 1000, spent: 0, remaining: 1000 });
    });

    it('archives every skipped cycle when the user was away for months', async () => {
        // Start: Mar 18, today: Jun 20 → Mar/Apr/May should all roll, Jun 18 → Jul 17 becomes active.
        freezeDate('2026-06-20T12:00:00.000Z');
        mockGetConfig.mockResolvedValue(makeConfig('2026-03-18', 'monthly'));
        mockGetExpenses
            .mockResolvedValueOnce([{ id: 1, amount: 100, date: '2026-03-25' }]) // Mar cycle
            .mockResolvedValueOnce([])                                            // Apr cycle (empty)
            .mockResolvedValueOnce([{ id: 2, amount: 250, date: '2026-05-30' }]) // May cycle
            .mockResolvedValueOnce([{ id: 3, amount: 75, date: '2026-06-19' }]);  // current Jun cycle

        const { result } = renderHook(() => useHousehold());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(mockArchive).toHaveBeenCalledTimes(3);
        expect(mockArchive.mock.calls.map(c => c[0].start_date)).toEqual([
            '2026-03-18',
            '2026-04-18',
            '2026-05-18',
        ]);
        expect(mockReset).toHaveBeenLastCalledWith('2026-06-18');
        expect(result.current.periodRange.start).toBe('2026-06-18');
        expect(result.current.periodRange.end).toBe('2026-07-17');
        expect(result.current.summary.spent).toBe(75);
    });

    it('rolls a 31st-anchored budget month-by-month without skipping February', async () => {
        // Start Jan 31, today mid-April. Jan and Feb cycles must both archive (Feb is NOT skipped),
        // and the anchor recovers the 31st each long month: Jan31→Feb27, Feb28→Mar30, active Mar31→Apr29.
        freezeDate('2026-04-15T12:00:00.000Z');
        mockGetConfig.mockResolvedValue(makeConfig('2026-01-31', 'monthly', 31));
        mockGetExpenses
            .mockResolvedValueOnce([{ id: 1, amount: 100, date: '2026-02-10' }]) // Jan 31 – Feb 27
            .mockResolvedValueOnce([{ id: 2, amount: 200, date: '2026-03-15' }]) // Feb 28 – Mar 30
            .mockResolvedValueOnce([]);                                          // active Mar 31 – Apr 29

        const { result } = renderHook(() => useHousehold());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(mockArchive).toHaveBeenCalledTimes(2);
        expect(mockArchive.mock.calls.map(c => [c[0].start_date, c[0].end_date])).toEqual([
            ['2026-01-31', '2026-02-27'],
            ['2026-02-28', '2026-03-30'],
        ]);
        expect(mockReset).toHaveBeenLastCalledWith('2026-03-31');
        expect(result.current.periodRange.start).toBe('2026-03-31');
        expect(result.current.periodRange.end).toBe('2026-04-29');
    });

    it('returns empty state when no config exists', async () => {
        mockGetConfig.mockResolvedValue(null);

        const { result } = renderHook(() => useHousehold());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.config).toBeNull();
        expect(result.current.expenses).toEqual([]);
        expect(result.current.summary).toEqual({ income: 0, spent: 0, remaining: 0 });
        expect(mockArchive).not.toHaveBeenCalled();
    });
});
