import { renderHook, waitFor } from '@testing-library/react-native';
import { useTransactions } from '@/hooks/use-transactions';
import { getDb } from '@/lib/db/db-client';

const mockGetDb = getDb as jest.Mock;

const mockTransactionRows = [
  {
    id: 1,
    category_id: 2,
    account_id: 1,
    amount: 500,
    note: 'Groceries',
    type: 'expense',
    date: '2026-05-01',
    categoryName: 'Food',
    categoryIcon: '🍔',
    categoryColor: '#FF0000',
    accountName: 'Main Wallet',
  },
  {
    id: 2,
    category_id: 3,
    account_id: 1,
    amount: 3000,
    note: 'Salary',
    type: 'income',
    date: '2026-05-01',
    categoryName: 'Salary',
    categoryIcon: '💰',
    categoryColor: '#00FF00',
    accountName: 'Main Wallet',
  },
];

function buildDbMock(rows = mockTransactionRows) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockResolvedValue(rows),
  } as unknown;
  return chain;
}

describe('useTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with loading true and empty transactions', () => {
    mockGetDb.mockReturnValue(buildDbMock([]));
    const { result } = renderHook(() => useTransactions());
    expect(result.current.loading).toBe(true);
    expect(result.current.transactions).toEqual([]);
  });

  it('loads transactions and sets loading to false', async () => {
    mockGetDb.mockReturnValue(buildDbMock());
    const { result } = renderHook(() => useTransactions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.transactions).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('maps rows to Transaction shape correctly', async () => {
    mockGetDb.mockReturnValue(buildDbMock());
    const { result } = renderHook(() => useTransactions());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const first = result.current.transactions[0];
    expect(first.id).toBe(1);
    expect(first.amount).toBe(500);
    expect(first.type).toBe('expense');
    expect(first.category).toBe('Food');
  });

  it('returns empty array when no transactions exist', async () => {
    mockGetDb.mockReturnValue(buildDbMock([]));
    const { result } = renderHook(() => useTransactions());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.transactions).toEqual([]);
  });

  it('exposes a refresh function', () => {
    mockGetDb.mockReturnValue(buildDbMock());
    const { result } = renderHook(() => useTransactions());
    expect(typeof result.current.refresh).toBe('function');
  });
});
