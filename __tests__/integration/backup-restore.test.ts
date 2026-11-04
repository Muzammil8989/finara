jest.unmock('@/lib/db/db-client');
jest.mock('expo-file-system/legacy', () => ({}));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('@/features/notifications/services/notification-service', () => ({
  NotificationService: { sendBackupComplete: jest.fn() },
}));

import * as q from '@/lib/db/queries';
import { BackupService, sanitizeBackupProfile, validateBackup } from '@/features/backup/services/backup-service';
import { createTestDb, TestDb } from '@/tests/helpers/test-db';

let db: TestDb;
beforeEach(async () => { db = await createTestDb(); });
afterEach(() => db.close());

const count = (table: string) => (db.raw.prepare(`select count(*) c from ${table}`).get() as { c: number }).c;

async function seedEverything() {
  const accountId = (await q.getAccounts())[0].id;
  await q.updateAccount(accountId, { balance: 500 });
  const incomeCat = (await q.getCategories('income'))[0].id;
  const expenseCat = (await q.getCategories('expense'))[0].id;
  await q.createTransaction({ amount: 1000, type: 'income', category_id: incomeCat, account_id: accountId, date: '2026-03-01' } as any);
  await q.createTransactionWithRecurring({ amount: 15, type: 'expense', category_id: expenseCat, account_id: accountId, date: '2026-03-02' } as any, 'monthly');
  await q.createBudget({ category_id: expenseCat, amount: 200, period: 'monthly' } as any);
  await q.createSavingsGoal({ name: 'Trip', target_amount: 900, saved_amount: 100 } as any);
  await q.upsertHouseholdConfig({ income_amount: 300, period: 'monthly', period_start_date: '2026-03-01' } as any);
  await q.createHouseholdTransfer({ amount: 40, accountId, accountName: 'Cash', incomeCategoryId: incomeCat, date: '2026-03-03' });
  const cats = await q.ensureSystemLoanCategories();
  const loan = await q.createLoan({ type: 'given', person_name: 'Sara', amount: 60, account_id: accountId, date: '2026-03-04', due_date: null, notes: null, is_settled: 0 }, cats);
  await q.createLoanPayment({ loan_id: loan.id, amount: 20, date: '2026-03-05', notes: null }, loan, cats);
}

const TABLES = [
  'accounts', 'categories', 'transactions', 'recurring_expenses', 'budgets', 'savings_goals',
  'household_config', 'household_expenses', 'loans', 'loan_payments',
];

describe('backup & restore (real SQLite)', () => {
  it('round-trips every table, including loans and household data', async () => {
    await seedEverything();
    const before = Object.fromEntries(TABLES.map(t => [t, count(t)]));
    const balanceBefore = await q.getCurrentBalance();
    const backup = JSON.parse(JSON.stringify(await BackupService.exportAllData()));

    // Wipe user data, then restore.
    for (const t of ['loan_payments', 'loans', 'household_expenses', 'household_config', 'savings_goals', 'transactions', 'budgets', 'recurring_expenses']) {
      db.raw.exec(`DELETE FROM ${t}`);
    }
    await BackupService.restoreData(backup);

    expect(Object.fromEntries(TABLES.map(t => [t, count(t)]))).toEqual(before);
    expect(await q.getCurrentBalance()).toBe(balanceBefore);
    expect((await q.getLoans())[0]).toMatchObject({ person_name: 'Sara', settled_amount: 20 });
    expect(db.raw.pragma('foreign_keys', { simple: true })).toBe(1);
  });

  it('restores a v1 backup that has no loan or household sections', async () => {
    await seedEverything();
    const full = await BackupService.exportAllData();
    const v1 = {
      version: 1,
      exportedAt: full.exportedAt,
      data: {
        accounts: full.data.accounts,
        categories: full.data.categories,
        transactions: full.data.transactions,
        recurringExpenses: full.data.recurringExpenses,
        budgets: full.data.budgets,
        savingsGoals: full.data.savingsGoals,
      },
    };
    await BackupService.restoreData(v1 as any);
    expect(count('transactions')).toBe(full.data.transactions!.length);
    expect(count('loans')).toBe(0);
  });

  it('rejects a file missing a required table without touching existing data', async () => {
    await seedEverything();
    const txBefore = count('transactions');
    const bad = { version: 2, exportedAt: '', data: { accounts: [], categories: [] } };
    await expect(BackupService.restoreData(bad as any)).rejects.toThrow(/missing "transactions"/);
    expect(count('transactions')).toBe(txBefore);
  });

  it('rolls back completely if an insert fails midway', async () => {
    await seedEverything();
    const txBefore = count('transactions');
    const backup = await BackupService.exportAllData();
    // A row that violates a CHECK constraint (amount must be > 0).
    backup.data.loans = [{ id: 99, type: 'given', person_name: 'X', amount: -5, account_id: 1, date: '2026-01-01' }];
    await expect(BackupService.restoreData(backup)).rejects.toThrow();
    expect(count('transactions')).toBe(txBefore);
    expect(count('loans')).toBe(1);
    expect(db.raw.pragma('foreign_keys', { simple: true })).toBe(1);
  });

  it('validateBackup rejects non-list sections and newer versions', () => {
    expect(() => validateBackup({ version: 2, data: { accounts: {}, categories: [], transactions: [] } })).toThrow(/not a list/);
    expect(() => validateBackup({ version: 99, data: { accounts: [], categories: [], transactions: [] } })).toThrow(/newer version/);
    expect(validateBackup({ version: 1, data: { accounts: [], categories: [], transactions: [] } }).loans).toEqual([]);
  });

  it('rejects a backup whose records point to missing data, keeping current data', async () => {
    await seedEverything();
    const txBefore = count('transactions');
    const backup = await BackupService.exportAllData();
    backup.data.transactions!.push({ ...backup.data.transactions![0], id: 999, category_id: 12345, account_id: 777 } as any);
    await expect(BackupService.restoreData(backup)).rejects.toThrow(/damaged/);
    expect(count('transactions')).toBe(txBefore);
    expect(db.raw.pragma('foreign_keys', { simple: true })).toBe(1);
  });

  it('validateBackup rejects transactions with unusable amount, date or type', () => {
    const base = { id: 1, category_id: 1, account_id: 1, amount: 5, type: 'expense', date: '2026-01-01' };
    const v = (tx: object) => () => validateBackup({ version: 2, data: { accounts: [], categories: [], transactions: [tx] } });
    expect(v({ ...base, amount: 'abc' })).toThrow(/invalid amount/);
    expect(v({ ...base, amount: -3 })).toThrow(/invalid amount/);
    expect(v({ ...base, date: 'garbage' })).toThrow(/invalid date/);
    expect(v({ ...base, type: 'transfer' })).toThrow(/invalid type/);
    expect(v(base)).not.toThrow();
  });

  it('carries the profile currency through a backup and returns it on restore', async () => {
    await seedEverything();
    const backup = JSON.parse(JSON.stringify(await BackupService.exportAllData()));
    backup.profile = { name: 'Ada', currency: 'PKR', theme: 'dark' };
    const result = await BackupService.restoreData(backup);
    expect(result.profile).toEqual({ name: 'Ada', currency: 'PKR', theme: 'dark' });
  });

  it('ignores malformed profile fields from a backup file', () => {
    expect(sanitizeBackupProfile({ name: 'x'.repeat(80), currency: 'pkr', theme: 'neon' })).toBeUndefined();
    expect(sanitizeBackupProfile({ currency: 'EUR', extra: 1 })).toEqual({ currency: 'EUR' });
    expect(sanitizeBackupProfile(null)).toBeUndefined();
  });

  it('setAccountsCurrency keeps every account in the profile currency', async () => {
    await q.createAccount({ name: 'Euro card', type: 'credit', balance: 0, currency: 'EUR' } as any);
    await q.setAccountsCurrency('PKR');
    expect(new Set((await q.getAccounts()).map(a => a.currency))).toEqual(new Set(['PKR']));
  });
});
