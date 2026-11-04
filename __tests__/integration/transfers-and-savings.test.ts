jest.unmock('@/lib/db/db-client');
import * as q from '@/lib/db/queries';
import { createTestDb, TestDb } from '@/tests/helpers/test-db';

let db: TestDb;
let bank: number;
let cash: number;
let incomeCat: number;

const D = '2026-04-10';
const NOW = new Date(2026, 3, 20);
const balances = async () => {
  const all = await q.getAccountsWithBalance();
  return { bank: all.find(a => a.id === bank)!.balance, cash: all.find(a => a.id === cash)!.balance };
};
const goalById = async (id: number) => (await q.getSavingsGoals()).find(g => g.id === id)!;
const count = (table: string) => (db.raw.prepare(`select count(*) c from ${table}`).get() as { c: number }).c;

beforeEach(async () => {
  db = await createTestDb();
  const accounts = await q.getAccounts();
  bank = accounts[0].id;
  cash = (await q.createAccount({ name: 'Wallet', type: 'cash', balance: 0, currency: 'USD' } as any)).id;
  incomeCat = (await q.getCategories('income'))[0].id;
  await q.createTransaction({ amount: 1000, type: 'income', date: D, account_id: bank, category_id: incomeCat } as any);
});
afterEach(() => db.close());

describe('account transfers', () => {
  it('move money between accounts without counting as income or spending', async () => {
    await q.createAccountTransfer({ fromAccountId: bank, toAccountId: cash, amount: 250, date: D });
    expect(await balances()).toEqual({ bank: 750, cash: 250 });
    expect(await q.getCurrentBalance()).toBe(1000);
    const [apr] = await q.getMonthlyTotals(1, NOW);
    expect(apr).toMatchObject({ income: 1000, expense: 0 });
    expect(await q.getExpenseByCategory('2026-04-01', '2026-04-30')).toEqual([]);
  });

  it('deleting either half removes the whole transfer', async () => {
    await q.createAccountTransfer({ fromAccountId: bank, toAccountId: cash, amount: 100, date: D });
    const half = db.raw.prepare("select id from transactions where transfer_group is not null limit 1").get() as { id: number };
    await q.deleteTransaction(half.id);
    expect(count('transactions')).toBe(1);
    expect(await balances()).toEqual({ bank: 1000, cash: 0 });
  });

  it('rejects a transfer to the same account or of nothing', async () => {
    await expect(q.createAccountTransfer({ fromAccountId: bank, toAccountId: bank, amount: 5, date: D })).rejects.toThrow(/different accounts/);
    await expect(q.createAccountTransfer({ fromAccountId: bank, toAccountId: cash, amount: 0, date: D })).rejects.toThrow(/above zero/);
  });
});

describe('savings goals funded from an account', () => {
  it('a deposit leaves the account and lands in the goal, without being spending', async () => {
    const goal = await q.createSavingsGoal({ name: 'Trip', target_amount: 500, saved_amount: 0 } as any);
    await q.moveSavings({ goalId: goal.id, accountId: bank, amount: 200, date: D, direction: 'deposit' });
    expect((await balances()).bank).toBe(800);
    expect((await goalById(goal.id)).saved_amount).toBe(200);
    const [apr] = await q.getMonthlyTotals(1, NOW);
    expect(apr.expense).toBe(0);
  });

  it('a withdrawal returns money to the account and lowers the goal', async () => {
    const goal = await q.createSavingsGoal({ name: 'Trip', target_amount: 500, saved_amount: 0 } as any);
    await q.moveSavings({ goalId: goal.id, accountId: bank, amount: 300, date: D, direction: 'deposit' });
    await q.moveSavings({ goalId: goal.id, accountId: cash, amount: 120, date: D, direction: 'withdraw' });
    expect(await balances()).toEqual({ bank: 700, cash: 120 });
    expect((await goalById(goal.id)).saved_amount).toBe(180);
  });

  it('refuses to over-fill a goal or withdraw more than it holds', async () => {
    const goal = await q.createSavingsGoal({ name: 'Trip', target_amount: 100, saved_amount: 0 } as any);
    await expect(q.moveSavings({ goalId: goal.id, accountId: bank, amount: 150, date: D, direction: 'deposit' })).rejects.toThrow(/100.00 left/);
    await expect(q.moveSavings({ goalId: goal.id, accountId: bank, amount: 1, date: D, direction: 'withdraw' })).rejects.toThrow(/0.00 saved/);
  });

  it('completes the goal when the target is reached and reopens on withdrawal', async () => {
    const goal = await q.createSavingsGoal({ name: 'Trip', target_amount: 100, saved_amount: 0 } as any);
    expect((await q.moveSavings({ goalId: goal.id, accountId: bank, amount: 100, date: D, direction: 'deposit' })).is_completed).toBe(1);
    expect((await q.moveSavings({ goalId: goal.id, accountId: bank, amount: 10, date: D, direction: 'withdraw' })).is_completed).toBe(0);
  });

  it('deleting a deposit transaction takes it back out of the goal', async () => {
    const goal = await q.createSavingsGoal({ name: 'Trip', target_amount: 500, saved_amount: 0 } as any);
    await q.moveSavings({ goalId: goal.id, accountId: bank, amount: 200, date: D, direction: 'deposit' });
    const dep = db.raw.prepare('select id from transactions where savings_goal_id = ?').get(goal.id) as { id: number };
    await q.deleteTransaction(dep.id);
    expect((await goalById(goal.id)).saved_amount).toBe(0);
    expect((await balances()).bank).toBe(1000);
  });

  it('deleting a goal returns its money to the accounts', async () => {
    const goal = await q.createSavingsGoal({ name: 'Trip', target_amount: 500, saved_amount: 0 } as any);
    await q.moveSavings({ goalId: goal.id, accountId: bank, amount: 200, date: D, direction: 'deposit' });
    await q.deleteSavingsGoal(goal.id);
    expect((await balances()).bank).toBe(1000);
    expect(count('savings_goals')).toBe(0);
  });
});

describe('system categories', () => {
  it('are hidden from category pickers but available on request', async () => {
    await q.createAccountTransfer({ fromAccountId: bank, toAccountId: cash, amount: 1, date: D });
    await q.ensureSystemLoanCategories();
    const visible = (await q.getCategories()).map(c => c.name);
    for (const name of q.TRANSFER_CATEGORY_NAMES) expect(visible).not.toContain(name);
    const all = (await q.getCategories(undefined, { includeSystem: true })).map(c => c.name);
    expect(all).toEqual(expect.arrayContaining(['Transfer Out', 'Transfer In', 'Loan Given', 'Loan Received']));
  });
});
