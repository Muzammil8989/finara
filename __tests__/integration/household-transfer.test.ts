jest.unmock('@/lib/db/db-client');
import * as q from '@/lib/db/queries';
import { createTestDb, TestDb } from '@/tests/helpers/test-db';

let db: TestDb;
let accountId: number;
let incomeCat: number;

beforeEach(async () => {
  db = await createTestDb();
  accountId = (await q.getAccounts())[0].id;
  incomeCat = (await q.getCategories('income'))[0].id;
});
afterEach(() => db.close());

const transfer = (amount: number) =>
  q.createHouseholdTransfer({ amount, accountId, accountName: 'Cash', incomeCategoryId: incomeCat, date: '2026-03-10' });
const count = (table: string) => (db.raw.prepare(`select count(*) c from ${table}`).get() as { c: number }).c;
const ids = (table: string) => (db.raw.prepare(`select id from ${table} order by id`).all() as { id: number }[]).map(r => r.id);

describe('household transfers', () => {
  it('creates the income and the linked household expense together', async () => {
    const { income, expense } = await transfer(75);
    expect(expense.linked_transaction_id).toBe(income.id);
    expect(income.notes).toBe(q.HOUSEHOLD_TRANSFER_NOTE);
  });

  it('deleting the income transaction removes only its paired expense', async () => {
    const a = await transfer(50);
    const b = await transfer(50); // same date + amount: must survive
    await q.deleteTransaction(a.income.id);
    expect(ids('transactions')).toEqual([b.income.id]);
    expect(ids('household_expenses')).toEqual([b.expense.id]);
  });

  it('deleting the household expense removes only its paired income', async () => {
    const a = await transfer(20);
    const b = await transfer(20);
    const rows = await q.getHouseholdExpenses('2026-03-01', '2026-03-31');
    await q.deleteHouseholdExpenseWithLink(rows.find(e => e.id === a.expense.id)!);
    expect(ids('transactions')).toEqual([b.income.id]);
    expect(ids('household_expenses')).toEqual([b.expense.id]);
  });

  it('pairs legacy (unlinked) transfers one-to-one, matching amounts to the cent', async () => {
    // Rows written before DB v9 have no link value.
    for (let i = 0; i < 2; i++) {
      await q.createTransaction({
        amount: 0.1 + 0.2, // 0.30000000000000004
        type: 'income',
        category_id: incomeCat,
        account_id: accountId,
        date: '2026-03-10',
        notes: q.HOUSEHOLD_TRANSFER_NOTE,
      } as any);
      await q.createHouseholdExpense({ amount: 0.3, category_id: null, date: '2026-03-10', notes: 'transfer-out:Cash' });
    }
    const [first] = await q.getHouseholdExpenses('2026-03-01', '2026-03-31');
    await q.deleteHouseholdExpenseWithLink(first);
    expect(count('transactions')).toBe(1);
    expect(count('household_expenses')).toBe(1);

    const [remainingTx] = ids('transactions');
    await q.deleteTransaction(remainingTx);
    expect(count('household_expenses')).toBe(0);
  });
});
