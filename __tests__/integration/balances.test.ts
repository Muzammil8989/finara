jest.unmock('@/lib/db/db-client');
import * as q from '@/lib/db/queries';
import { todayString } from '@/lib/utils/date';
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

const add = (type: 'income' | 'expense', amount: number, extra: object = {}) =>
  q.createTransaction({
    amount,
    type,
    category_id: type === 'income' ? incomeCat : expenseCat,
    account_id: accountId,
    date: '2026-03-10',
    ...extra,
  } as any);

describe('balances', () => {
  it('current balance includes account opening balances', async () => {
    await q.updateAccount(accountId, { balance: 1000 });
    await add('expense', 200);
    expect(await q.getCurrentBalance()).toBe(800);
  });

  it('current balance equals the sum of per-account balances', async () => {
    await q.updateAccount(accountId, { balance: 50 });
    await add('income', 300);
    await add('expense', 120.5);
    const perAccount = (await q.getAccountsWithBalance()).reduce((s, a) => s + a.balance, 0);
    expect(await q.getCurrentBalance()).toBeCloseTo(perAccount, 6);
    expect(perAccount).toBeCloseTo(229.5, 6);
  });

  it('createTransaction defaults to the local date when none is given', async () => {
    const t = await add('income', 1, { date: undefined });
    expect(t.date).toBe(todayString());
  });

  it('clearing a note persists as null', async () => {
    const t = await add('income', 10, { notes: 'hello' });
    await q.updateTransaction(t.id, { notes: null });
    expect((await q.getTransactionById(t.id))?.notes).toBeNull();
  });
});
