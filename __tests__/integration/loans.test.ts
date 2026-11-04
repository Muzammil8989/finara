jest.unmock('@/lib/db/db-client');
import * as q from '@/lib/db/queries';
import { createTestDb, TestDb } from '@/tests/helpers/test-db';

let db: TestDb;
let accountId: number;
let cats: { expenseCategoryId: number; incomeCategoryId: number };

beforeEach(async () => {
  db = await createTestDb();
  accountId = (await q.getAccounts())[0].id;
  cats = await q.ensureSystemLoanCategories();
});
afterEach(() => db.close());

const newLoan = (type: 'given' | 'taken', amount: number) =>
  q.createLoan(
    { type, person_name: 'Ali', amount, account_id: accountId, date: '2026-03-01', due_date: null, notes: null, is_settled: 0 },
    cats
  );
const pay = (loan: q.LoanWithDetails, amount: number) =>
  q.createLoanPayment({ loan_id: loan.id, amount, date: '2026-03-05', notes: null }, loan, cats);
const loanById = async (id: number) => (await q.getLoans()).find(l => l.id === id);
const count = (table: string) => (db.raw.prepare(`select count(*) c from ${table}`).get() as { c: number }).c;

describe('loans', () => {
  it('lending deducts from the balance and the repayment transfer restores it', async () => {
    const loan = await newLoan('given', 100);
    expect(await q.getCurrentBalance()).toBe(-100);
    await pay(loan, 100);
    await q.transferLoanToAccount(loan.id, cats);
    expect(await q.getCurrentBalance()).toBe(0);
  });

  it('borrowing adds to the balance and the repayment removes it', async () => {
    const loan = await newLoan('taken', 250);
    expect(await q.getCurrentBalance()).toBe(250);
    await pay(loan, 250);
    await q.transferLoanToAccount(loan.id, cats);
    expect(await q.getCurrentBalance()).toBe(0);
  });

  it('cannot transfer the same loan twice', async () => {
    const loan = await newLoan('given', 10);
    await pay(loan, 10);
    await q.transferLoanToAccount(loan.id, cats);
    await expect(q.transferLoanToAccount(loan.id, cats)).rejects.toThrow(/already transferred/);
  });

  it('settles despite float drift (0.7 + 0.4 = 1.1)', async () => {
    const loan = await newLoan('given', 1.1);
    await pay(loan, 0.7);
    let current = (await loanById(loan.id))!;
    expect(current.is_settled).toBe(0);
    await pay(current, 0.4);
    current = (await loanById(loan.id))!;
    expect(current.is_settled).toBe(1);
    expect(current.remaining_amount).toBe(0);
    expect(current.settled_amount).toBe(1.1);
  });

  it('deleting a loan removes its payments and both transactions', async () => {
    const loan = await newLoan('given', 40);
    await pay(loan, 40);
    await q.transferLoanToAccount(loan.id, cats);
    await q.deleteLoan(loan.id);
    expect(count('loan_payments')).toBe(0);
    expect(count('transactions')).toBe(0);
    expect(await q.getCurrentBalance()).toBe(0);
  });

  it('deleting the "Loan repaid" transaction keeps the loan and re-enables transfer', async () => {
    const loan = await newLoan('given', 30);
    await pay(loan, 30);
    await q.transferLoanToAccount(loan.id, cats);
    const transferId = (await loanById(loan.id))!.transaction_id!;
    await q.deleteTransaction(transferId);
    const after = await loanById(loan.id);
    expect(after).toBeDefined();
    expect(after!.transaction_id).toBeNull();
  });

  it('deleting the loan origin transaction deletes the loan', async () => {
    const loan = await newLoan('given', 30);
    await q.deleteTransaction(loan.origin_transaction_id!);
    expect(await loanById(loan.id)).toBeUndefined();
  });

  it('refuses to transfer a loan that is not fully repaid', async () => {
    const loan = await newLoan('given', 100);
    await pay(loan, 30);
    await expect(q.transferLoanToAccount(loan.id, cats)).rejects.toThrow(/not fully repaid/);
  });

  it('rejects a payment larger than what is still owed, even from a stale snapshot', async () => {
    const loan = await newLoan('given', 100);
    await pay(loan, 60);
    // Same (stale) loan object: settled_amount still says 0.
    await expect(pay(loan, 60)).rejects.toThrow(/more than the 40.00 still owed/);
    await pay(loan, 40);
    expect((await loanById(loan.id))!.is_settled).toBe(1);
  });
});
