jest.unmock('@/lib/db/db-client');
import { buildReportData } from '@/features/export/services/report-data';
import { buildWorkbook } from '@/features/export/services/excel-export';
import * as q from '@/lib/db/queries';
import { createTestDb, TestDb } from '@/tests/helpers/test-db';
import * as XLSX from 'xlsx';

/**
 * Lending, borrowing and repaying move money between people — they are not
 * spending or income. They must change balances but stay out of every
 * income/spending total, chart, budget and export summary.
 */
let db: TestDb;
let accountId: number;
let incomeCat: number;
let expenseCat: number;

const NOW = new Date(2026, 3, 20); // 20 Apr 2026
const D = '2026-04-10';

beforeEach(async () => {
  db = await createTestDb();
  accountId = (await q.getAccounts())[0].id;
  incomeCat = (await q.getCategories('income'))[0].id;
  expenseCat = (await q.getCategories('expense'))[0].id;

  await q.createTransaction({ amount: 1000, type: 'income', date: D, account_id: accountId, category_id: incomeCat } as any);
  await q.createTransaction({ amount: 200, type: 'expense', date: D, account_id: accountId, category_id: expenseCat } as any);
  const cats = await q.ensureSystemLoanCategories();
  await q.createLoan({ type: 'given', person_name: 'Sara', amount: 500, account_id: accountId, date: D, due_date: null, notes: null, is_settled: 0 }, cats);
  await q.createLoan({ type: 'taken', person_name: 'Ali', amount: 300, account_id: accountId, date: D, due_date: null, notes: null, is_settled: 0 }, cats);
});
afterEach(() => db.close());

describe('loan transfers are not income or spending', () => {
  it('still move the balance', async () => {
    // 1000 - 200 - 500 (lent) + 300 (borrowed)
    expect(await q.getCurrentBalance()).toBe(600);
  });

  it('are excluded from monthly totals', async () => {
    const [apr] = (await q.getMonthlyTotals(1, NOW));
    expect(apr).toMatchObject({ income: 1000, expense: 200 });
  });

  it('are excluded from spending by category', async () => {
    const cats = await q.getExpenseByCategory('2026-04-01', '2026-04-30');
    expect(cats.map(c => c.total)).toEqual([200]);
  });

  it('are excluded from daily spending', async () => {
    const days = await q.getDailySpending('2026-04-01', '2026-04-30', NOW);
    expect(days.find(d => d.day === 10)?.amount).toBe(200);
  });

  it('do not count against an all-expenses budget', async () => {
    const [row] = await q.getBudgetSpend(null, '2026-04-01', '2026-04-30');
    expect(Number(row.total)).toBe(200);
  });

  it('are excluded from the export summary but listed as transfers', async () => {
    const data = await buildReportData({ start: '2026-04-01', end: '2026-04-30', periodLabel: 'Apr', currency: 'USD', now: NOW });
    expect(data.summary).toMatchObject({ income: 1000, expense: 200, net: 800 });
    expect(data.transactions).toHaveLength(4);
    expect(data.transactions.filter(t => t.isTransfer)).toHaveLength(2);

    const wb = XLSX.read(XLSX.write(buildWorkbook(data), { type: 'base64', bookType: 'xlsx' }), { type: 'base64' });
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets.Transactions);
    expect(rows.filter(r => r.Type === 'Transfer')).toHaveLength(2);
  });
});

describe('isTransferCategory', () => {
  it('recognises only the system loan categories', () => {
    expect(q.isTransferCategory('Loan Given')).toBe(true);
    expect(q.isTransferCategory('Loan Received')).toBe(true);
    expect(q.isTransferCategory('Loans and fees')).toBe(false);
    expect(q.isTransferCategory(undefined)).toBe(false);
  });
});
