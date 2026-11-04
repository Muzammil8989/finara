jest.unmock('@/lib/db/db-client');
import * as q from '@/lib/db/queries';
import { createTestDb, TestDb } from '@/tests/helpers/test-db';

let db: TestDb;
let accountId: number;
let incomeCat: number;
let expenseCat: number;

beforeEach(async () => {
  db = await createTestDb();
  accountId = (await q.getAccounts())[0].id;
  incomeCat = (await q.getCategories('income'))[0].id;
  expenseCat = (await q.getCategories('expense'))[0].id;
});
afterEach(() => db.close());

const add = (type: 'income' | 'expense', amount: number, date: string) =>
  q.createTransaction({ amount, type, date, account_id: accountId, category_id: type === 'income' ? incomeCat : expenseCat } as any);

const NOW = new Date(2026, 3, 20); // 20 Apr 2026

describe('getMonthlyTotals', () => {
  it('returns exactly the last N calendar months, zero-filling empty ones', async () => {
    await add('income', 1000, '2026-01-05');
    await add('expense', 200, '2026-01-10');
    await add('expense', 50, '2026-04-02');
    await add('expense', 999, '2025-06-01'); // outside the window

    const months = await q.getMonthlyTotals(4, NOW);
    expect(months).toEqual([
      { month: 'Jan', year: 2026, income: 1000, expense: 200 },
      { month: 'Feb', year: 2026, income: 0, expense: 0 },
      { month: 'Mar', year: 2026, income: 0, expense: 0 },
      { month: 'Apr', year: 2026, income: 0, expense: 50 },
    ]);
  });

  it('ignores future-dated transactions', async () => {
    await add('expense', 70, '2026-08-01');
    const months = await q.getMonthlyTotals(2, NOW);
    expect(months.map(m => m.month)).toEqual(['Mar', 'Apr']);
    expect(months.every(m => m.expense === 0)).toBe(true);
  });

  it('crosses a year boundary', async () => {
    const months = await q.getMonthlyTotals(3, new Date(2026, 0, 15));
    expect(months.map(m => `${m.month} ${m.year}`)).toEqual(['Nov 2025', 'Dec 2025', 'Jan 2026']);
  });
});

describe('getDailySpending', () => {
  it('has one point per day up to today, with zeros on days without spending', async () => {
    await add('expense', 10, '2026-04-01');
    await add('expense', 5, '2026-04-03');
    await add('expense', 7, '2026-04-03');
    await add('income', 500, '2026-04-02'); // income is not spending

    const days = await q.getDailySpending('2026-04-01', '2026-04-30', new Date(2026, 3, 4));
    expect(days).toEqual([
      { day: 1, amount: 10 },
      { day: 2, amount: 0 },
      { day: 3, amount: 12 },
      { day: 4, amount: 0 },
    ]);
  });

  it('covers the whole range for a past month', async () => {
    const days = await q.getDailySpending('2026-02-01', '2026-02-28', NOW);
    expect(days).toHaveLength(28);
  });
});
