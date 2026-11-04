/**
 * Full screens rendered against a real (in-memory) SQLite database.
 * These catch crashes and wrong numbers that only appear with real data.
 */
jest.unmock('@/lib/db/db-client');
import OverviewScreen from '@/app/(tabs)/index';
import ReportsScreen from '@/app/(tabs)/reports';
import BudgetScreen from '@/app/(tabs)/budget';
import SavingsScreen from '@/app/(tabs)/savings';
import HouseholdScreen from '@/app/household';
import LoansScreen from '@/app/loans';
import * as q from '@/lib/db/queries';
import { toISODateString } from '@/lib/utils/date';
import { renderWithProviders, runInteractionsImmediately } from '@/tests/helpers/render-with-providers';
import { createTestDb, TestDb } from '@/tests/helpers/test-db';
import { screen } from '@testing-library/react-native';
import React from 'react';

let db: TestDb;
let accountId: number;
let incomeCat: number;
let expenseCat: number;

beforeEach(async () => {
  db = await createTestDb();
  runInteractionsImmediately();
  accountId = (await q.getAccounts())[0].id;
  incomeCat = (await q.getCategories('income'))[0].id;
  expenseCat = (await q.getCategories('expense'))[0].id;
});
afterEach(() => {
  db.close();
  jest.restoreAllMocks();
});

const day = (offset: number) => {
  const d = new Date();
  return toISODateString(new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset));
};
const add = (type: 'income' | 'expense', amount: number, date: string, notes?: string) =>
  q.createTransaction({ amount, type, date, notes, account_id: accountId, category_id: type === 'income' ? incomeCat : expenseCat } as any);

describe('Overview', () => {
  it('shows the total balance including opening balances', async () => {
    await q.updateAccount(accountId, { balance: 1000 });
    await add('expense', 250, day(0));
    await renderWithProviders(<OverviewScreen />);
    expect(await screen.findByLabelText('Current Balance: $750.00')).toBeTruthy();
  });

  it('shows a negative balance with a minus sign', async () => {
    await add('expense', 40, day(0));
    await renderWithProviders(<OverviewScreen />);
    expect(await screen.findByLabelText('Current Balance: -$40.00')).toBeTruthy();
  });

  it('has a compact sticky header with the name and balance for when the page is scrolled', async () => {
    await q.updateAccount(accountId, { balance: 1000 });
    await renderWithProviders(<OverviewScreen />);
    // Hidden from screen readers until scrolled; query hidden elements too.
    expect(await screen.findByLabelText('Current balance: $1,000.00', { includeHiddenElements: true })).toBeTruthy();
  });
});

describe('Insights', () => {
  it('renders with several days of spending this month (used to crash)', async () => {
    const now = new Date();
    if (now.getDate() < 3) return; // need 3 days in the current month
    await add('income', 500, day(-2));
    await add('expense', 20, day(-2));
    await add('expense', 35, day(-1));
    await add('expense', 15, day(0));
    await renderWithProviders(<ReportsScreen />);
    expect((await screen.findAllByText(/\$70\.00/)).length).toBeGreaterThan(0);
  });

  it('renders with no data', async () => {
    await renderWithProviders(<ReportsScreen />);
    expect(screen.toJSON()).toBeTruthy();
  });
});

describe('Budgets', () => {
  it('renders budgets of different periods without adding unlike amounts', async () => {
    await q.createBudget({ category_id: expenseCat, amount: 1200, period: 'yearly' } as any);
    await q.createBudget({ category_id: incomeCat, amount: 400, period: 'monthly' } as any);
    await renderWithProviders(<BudgetScreen />);
    expect(await screen.findByText('Budget / month')).toBeTruthy();
    expect(screen.getByText('$500.00')).toBeTruthy();
  });
});

describe('Savings', () => {
  it('lists goals', async () => {
    await q.createSavingsGoal({ name: 'Emergency fund', target_amount: 1000, saved_amount: 250 } as any);
    await renderWithProviders(<SavingsScreen />);
    expect(await screen.findByText('Emergency fund')).toBeTruthy();
  });
});

describe('Household', () => {
  it('shows "Over budget by" with currency formatting', async () => {
    await q.upsertHouseholdConfig({ income_amount: 100, period: 'monthly', period_start_date: day(0) } as any);
    await q.createHouseholdExpense({ amount: 150.5, category_id: null, date: day(0), notes: null });
    await renderWithProviders(<HouseholdScreen />);
    expect(await screen.findByText('Over budget by $50.50')).toBeTruthy();
  });
});

describe('Loans', () => {
  it('lists loans with their remaining amount', async () => {
    const cats = await q.ensureSystemLoanCategories();
    await q.createLoan({ type: 'given', person_name: 'Sara', amount: 60, account_id: accountId, date: day(0), due_date: null, notes: null, is_settled: 0 }, cats);
    await renderWithProviders(<LoansScreen />);
    expect(await screen.findByText('Sara')).toBeTruthy();
  });
});
