jest.unmock('@/lib/db/db-client');
jest.mock('@/features/notifications/services/notification-service', () => ({
  NotificationService: { checkAndSendBudgetAlert: jest.fn().mockResolvedValue(undefined) },
}));

import { ModalProvider } from '@/providers/modal-context';
import { useTransactions } from '@/features/transactions/hooks/use-transactions';
import * as q from '@/lib/db/queries';
import { runInteractionsImmediately } from '@/tests/helpers/render-with-providers';
import { createTestDb, TestDb } from '@/tests/helpers/test-db';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

let db: TestDb;
let accountId: number;
let food: { id: number; name: string };
let salary: { id: number; name: string };

beforeEach(async () => {
  db = await createTestDb();
  runInteractionsImmediately();
  accountId = (await q.getAccounts())[0].id;
  food = (await q.getCategories('expense'))[0];
  salary = (await q.getCategories('income'))[0];
});
afterEach(() => {
  db.close();
  jest.restoreAllMocks();
});

const wrapper = ({ children }: { children: React.ReactNode }) => <ModalProvider>{children}</ModalProvider>;
const add = (type: 'income' | 'expense', amount: number, date: string, notes?: string) =>
  q.createTransaction({ amount, type, date, notes, account_id: accountId, category_id: type === 'income' ? salary.id : food.id } as any);

describe('useTransactions (real SQLite)', () => {
  it('starts loading with no transactions', () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    expect(result.current.loading).toBe(true);
    expect(result.current.transactions).toEqual([]);
  });

  it('loads transactions newest first and maps them to the Transaction shape', async () => {
    await add('expense', 500, '2026-05-01', 'Groceries');
    await add('income', 3000, '2026-05-02', 'Pay');

    const { result } = renderHook(() => useTransactions(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.transactions).toHaveLength(2);
    expect(result.current.transactions[0]).toMatchObject({
      amount: 3000, type: 'income', date: '2026-05-02', note: 'Pay', category: salary.name, account_id: accountId,
    });
    expect(result.current.transactions[1]).toMatchObject({ amount: 500, type: 'expense', note: 'Groceries', category: food.name });
  });

  it('filters by type and date range', async () => {
    await add('expense', 10, '2026-05-01');
    await add('expense', 20, '2026-06-01');
    await add('income', 30, '2026-05-15');

    const { result } = renderHook(
      () => useTransactions({ type: 'expense', startDate: '2026-05-01', endDate: '2026-05-31' }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.transactions.map(t => t.amount)).toEqual([10]);
  });

  it('pages 50 rows at a time with loadMore, newest first and without duplicates', async () => {
    // One row per day so pages end exactly at 50.
    for (let i = 0; i < 120; i++) {
      const d = new Date(2026, 0, 1 + i);
      await add('expense', i + 1, `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }

    const { result } = renderHook(() => useTransactions(undefined, { withTotals: true }), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.transactions).toHaveLength(50);
    expect(result.current.hasMore).toBe(true);
    // Totals cover every row, not just the loaded page.
    expect(result.current.totals).toEqual({ income: 0, expense: (120 * 121) / 2, count: 120 });

    await result.current.loadMore();
    await waitFor(() => expect(result.current.transactions).toHaveLength(100));
    await result.current.loadMore();
    await waitFor(() => expect(result.current.transactions).toHaveLength(120));
    expect(result.current.hasMore).toBe(false);

    const ids = result.current.transactions.map(t => t.id);
    expect(new Set(ids).size).toBe(120);
    const dates = result.current.transactions.map(t => t.date!);
    expect([...dates].sort().reverse()).toEqual(dates);

    // Nothing more to load: a no-op.
    await result.current.loadMore();
    expect(result.current.transactions).toHaveLength(120);
  });

  it('refresh keeps the rows already loaded', async () => {
    for (let i = 0; i < 60; i++) await add('expense', 1, `2026-03-${String(1 + (i % 28)).padStart(2, '0')}`);
    const { result } = renderHook(() => useTransactions(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await result.current.loadMore();
    await waitFor(() => expect(result.current.hasMore).toBe(false));
    const loaded = result.current.transactions.length;

    await result.current.refresh();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.transactions).toHaveLength(loaded);
  });

  it('limit loads only that many newest rows', async () => {
    for (let i = 1; i <= 8; i++) await add('expense', i, `2026-05-0${i}`);
    const { result } = renderHook(() => useTransactions(undefined, { limit: 5 }), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.transactions.map(t => t.amount)).toEqual([8, 7, 6, 5, 4]);
    expect(result.current.hasMore).toBe(false);
  });

  it('paginate: false loads the whole filtered range', async () => {
    for (let i = 0; i < 70; i++) await add('expense', 1, `2026-04-${String(1 + (i % 28)).padStart(2, '0')}`);
    const { result } = renderHook(
      () => useTransactions({ startDate: '2026-04-01', endDate: '2026-04-30' }, { paginate: false }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.transactions).toHaveLength(70);
  });

  it('refresh picks up new rows', async () => {
    const { result } = renderHook(() => useTransactions(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.transactions).toEqual([]);

    await add('income', 5, '2026-05-01');
    await result.current.refresh();
    await waitFor(() => expect(result.current.transactions).toHaveLength(1));
  });
});
