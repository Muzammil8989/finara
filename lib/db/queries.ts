import {
  and,
  asc,
  between,
  count,
  desc,
  eq,
  gte,
  like,
  lte,
  sum
} from 'drizzle-orm';
import { logger } from '../logger';
import { getDb } from './db-client';
import {
  accounts,
  budgets,
  categories,
  householdConfig,
  householdExpenses,
  householdPeriodsHistory,
  loanPayments,
  loans,
  recurringExpenses,
  savingsGoals,
  transactions,
} from './schema';

import type {
  NewAccount,
  NewBudget,
  NewCategory,
  NewHouseholdConfig,
  NewHouseholdExpense,
  NewLoan,
  NewLoanPayment,
  NewRecurringExpense,
  NewSavingsGoal,
  NewTransaction
} from './schema';

export type {
  Account, Budget, Category, HouseholdConfig, HouseholdExpense, HouseholdPeriodHistory, Loan, LoanPayment, NewAccount, NewBudget, NewCategory, NewHouseholdConfig, NewHouseholdExpense, NewHouseholdPeriodHistory, NewLoan, NewLoanPayment, NewRecurringExpense, NewSavingsGoal, NewTransaction, RecurringExpense, SavingsGoal, Transaction
} from './schema';

/**
 * TRANSACTION QUERIES
 */

/**
 * Get current balance (totalIncome - totalExpense) from all transactions
 */
export async function getCurrentBalance(): Promise<number> {
  const db = getDb();
  const result = await db
    .select({
      type: transactions.type,
      total: sum(transactions.amount),
    })
    .from(transactions)
    .groupBy(transactions.type);

  let income = 0;
  let expense = 0;
  for (const row of result) {
    if (row.type === 'income') income = Number(row.total) || 0;
    else expense = Number(row.total) || 0;
  }
  return income - expense;
}

/**
 * Create a new transaction
 */
export async function createTransaction(
  transaction: NewTransaction
): Promise<typeof transactions.$inferSelect> {
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    return tx
      .insert(transactions)
      .values({
        ...transaction,
        date: transaction.date || new Date().toISOString().split('T')[0],
      })
      .returning();
  });
  return result[0];
}

/**
 * Get all transactions with optional filters and relations
 */
export async function getTransactions(options?: {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  type?: 'income' | 'expense';
  searchQuery?: string;
  limit?: number;
  offset?: number;
}) {
  const db = getDb();

  return db.query.transactions.findMany({
    where: (t, { eq, and, gte, lte, or, like }) => {
      const conditions = [];

      if (options?.startDate) conditions.push(gte(t.date, options.startDate));
      if (options?.endDate) conditions.push(lte(t.date, options.endDate));
      if (options?.categoryId) conditions.push(eq(t.category_id, options.categoryId));
      if (options?.type) conditions.push(eq(t.type, options.type));

      if (options?.searchQuery) {
        const query = `%${options.searchQuery}%`;
        conditions.push(or(
          like(t.notes, query),
        ));
      }

      return and(...conditions);
    },
    with: {
      category: true,
      account: true,
    },
    orderBy: (t, { desc }) => [desc(t.date), desc(t.id)],
    limit: options?.limit,
    offset: options?.offset,
  });
}

/**
 * Get transactions by date range (useful for monthly/weekly views)
 */
export async function getTransactionsByDateRange(
  startDate: string,
  endDate: string
) {
  const db = getDb();
  const conditions = [between(transactions.date, startDate, endDate)];

  return db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.date));
}

/**
 * Get total income and expenses for a period
 */
export async function getSummaryByDateRange(
  startDate: string,
  endDate: string
) {
  const db = getDb();
  const conditions = [between(transactions.date, startDate, endDate)];

  return db
    .select({
      type: transactions.type,
      total: sum(transactions.amount),
      count: count(),
    })
    .from(transactions)
    .where(and(...conditions))
    .groupBy(transactions.type);
}

/**
 * Get transaction by ID with related data
 */
export async function getTransactionById(id: number) {
  const db = getDb();
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .then((results) => results[0] || null);
}

/**
 * Update transaction
 */
export async function updateTransaction(
  id: number,
  updates: Partial<NewTransaction>
) {
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    return tx
      .update(transactions)
      .set({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .where(eq(transactions.id, id))
      .returning();
  });
  return result[0];
}

/**
 * Delete transaction — also removes any loan or loan payment whose primary
 * transaction_id matches this record, keeping loan data consistent.
 */
export async function deleteTransaction(id: number) {
  const db = getDb();
  await db.transaction(async (tx) => {
    // If a loan was created with this transaction, delete the loan (cascades its payments)
    await tx.delete(loans).where(eq(loans.transaction_id, id));
    // If a loan payment was linked to this transaction, delete the payment record
    await tx.delete(loanPayments).where(eq(loanPayments.transaction_id, id));
    await tx.delete(transactions).where(eq(transactions.id, id));
  });
}

/**
 * CATEGORY QUERIES
 */

/**
 * Get all categories
 */
export async function getCategories(type?: 'income' | 'expense') {
  const db = getDb();

  if (type) {
    return db
      .select()
      .from(categories)
      .where(eq(categories.type, type))
      .orderBy(asc(categories.name));
  }

  return db.select().from(categories).orderBy(asc(categories.name));
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: number) {
  const db = getDb();
  return db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .then((results) => results[0] || null);
}

/**
 * Create category
 */
export async function createCategory(
  category: NewCategory
): Promise<typeof categories.$inferSelect> {
  const db = getDb();
  const result = await db
    .insert(categories)
    .values(category)
    .returning();
  return result[0];
}

/**
 * Update category
 */
export async function updateCategory(
  id: number,
  updates: Partial<NewCategory>
) {
  const db = getDb();
  const result = await db
    .update(categories)
    .set({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .where(eq(categories.id, id))
    .returning();
  return result[0];
}

/**
 * Delete category (only if no associated transactions)
 */
export async function deleteCategory(id: number) {
  const db = getDb();
  const associatedTransactions = await db
    .select({ count: count() })
    .from(transactions)
    .where(eq(transactions.category_id, id));

  if ((associatedTransactions[0]?.count ?? 0) > 0) {
    throw new Error(
      'Cannot delete category with associated transactions'
    );
  }

  await db.delete(categories).where(eq(categories.id, id));
}

/**
 * RECURRING EXPENSE QUERIES
 */

/**
 * Get all active recurring expenses
 */
export async function getActiveRecurringExpenses() {
  const db = getDb();
  return db
    .select()
    .from(recurringExpenses)
    .where(eq(recurringExpenses.is_active, 1))
    .orderBy(asc(recurringExpenses.start_date));
}

/**
 * Get all recurring expenses with category and account info
 */
export async function getRecurringExpensesWithDetails() {
  const db = getDb();
  return db
    .select({
      id: recurringExpenses.id,
      amount: recurringExpenses.amount,
      frequency: recurringExpenses.frequency,
      start_date: recurringExpenses.start_date,
      end_date: recurringExpenses.end_date,
      notes: recurringExpenses.notes,
      is_active: recurringExpenses.is_active,
      category_id: recurringExpenses.category_id,
      account_id: recurringExpenses.account_id,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      categoryType: categories.type,
      accountName: accounts.name,
    })
    .from(recurringExpenses)
    .leftJoin(categories, eq(recurringExpenses.category_id, categories.id))
    .leftJoin(accounts, eq(recurringExpenses.account_id, accounts.id))
    .orderBy(desc(recurringExpenses.is_active), asc(recurringExpenses.start_date));
}

/**
 * Get recurring expense by ID
 */
export async function getRecurringExpenseById(id: number) {
  const db = getDb();
  return db
    .select()
    .from(recurringExpenses)
    .where(eq(recurringExpenses.id, id))
    .then((results) => results[0] || null);
}

/**
 * Check if an active recurring expense already exists for a given category
 */
export async function getActiveRecurringByCategory(categoryId: number) {
  const db = getDb();
  return db
    .select()
    .from(recurringExpenses)
    .where(and(eq(recurringExpenses.category_id, categoryId), eq(recurringExpenses.is_active, 1)))
    .limit(1);
}

/**
 * Create recurring expense
 */
export async function createRecurringExpense(
  expense: NewRecurringExpense
): Promise<typeof recurringExpenses.$inferSelect> {
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    return tx
      .insert(recurringExpenses)
      .values(expense)
      .returning();
  });
  return result[0];
}

/**
 * Update recurring expense
 */
export async function updateRecurringExpense(
  id: number,
  updates: Partial<NewRecurringExpense>
) {
  const db = getDb();
  const result = await db
    .update(recurringExpenses)
    .set({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .where(eq(recurringExpenses.id, id))
    .returning();
  return result[0];
}

/**
 * Deactivate recurring expense
 */
export async function deactivateRecurringExpense(id: number) {
  return updateRecurringExpense(id, { is_active: 0 });
}

/**
 * Delete recurring expense
 */
export async function deleteRecurringExpense(id: number) {
  const db = getDb();
  await db.delete(recurringExpenses).where(eq(recurringExpenses.id, id));
}

/**
 * BUDGET QUERIES
 */

/**
 * Get all active budgets with joined category details
 */
export async function getBudgetsWithDetails() {
  const db = getDb();
  return db
    .select({
      id: budgets.id,
      amount: budgets.amount,
      period: budgets.period,
      category_id: budgets.category_id,
      is_active: budgets.is_active,
      alert_threshold: budgets.alert_threshold,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
    })
    .from(budgets)
    .leftJoin(categories, eq(budgets.category_id, categories.id))
    .where(eq(budgets.is_active, 1))
    .orderBy(asc(budgets.id));
}

/**
 * Get all active budgets
 */
export async function getActiveBudgets() {
  const db = getDb();
  return db
    .select()
    .from(budgets)
    .where(eq(budgets.is_active, 1))
    .orderBy(asc(budgets.period));
}

/**
 * Get budget by ID
 */
export async function getBudgetById(id: number) {
  const db = getDb();
  return db
    .select()
    .from(budgets)
    .where(eq(budgets.id, id))
    .then((results) => results[0] || null);
}

/**
 * Get budgets by period
 */
export async function getBudgetsByPeriod(
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
) {
  const db = getDb();
  return db
    .select()
    .from(budgets)
    .where(
      and(
        eq(budgets.period, period),
        eq(budgets.is_active, 1)
      )
    );
}

/**
 * Create budget
 */
export async function createBudget(
  budget: NewBudget
): Promise<typeof budgets.$inferSelect> {
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    return tx
      .insert(budgets)
      .values(budget)
      .returning();
  });
  return result[0];
}

/**
 * Update budget
 */
export async function updateBudget(
  id: number,
  updates: Partial<NewBudget>
) {
  const db = getDb();
  const result = await db
    .update(budgets)
    .set({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .where(eq(budgets.id, id))
    .returning();
  return result[0];
}

/**
 * Deactivate budget
 */
export async function deactivateBudget(id: number) {
  return updateBudget(id, { is_active: 0 });
}

/**
 * Delete budget
 */
export async function deleteBudget(id: number) {
  const db = getDb();
  await db.delete(budgets).where(eq(budgets.id, id));
}

/**
 * Get budget spend for a category in a period
 */
export async function getBudgetSpend(
  categoryId: number | null,
  startDate: string,
  endDate: string
) {
  const db = getDb();
  const conditions = [between(transactions.date, startDate, endDate)];

  if (categoryId !== null) {
    conditions.push(eq(transactions.category_id, categoryId));
  }

  return db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(
      and(
        ...conditions,
        eq(transactions.type, 'expense')
      )
    );
}

/**
 * ACCOUNT QUERIES
 */

/**
 * Get all accounts
 */
export async function getAccounts() {
  const db = getDb();
  return db.select().from(accounts).orderBy(asc(accounts.name));
}

/**
 * Get all accounts with balance computed from transactions
 * real_balance = initial_balance + SUM(income) - SUM(expense)
 */
export async function getAccountsWithBalance() {
  const db = getDb();
  const accountList = await db.select().from(accounts).orderBy(asc(accounts.name));

  const incomeSums = await db
    .select({ account_id: transactions.account_id, total: sum(transactions.amount) })
    .from(transactions)
    .where(eq(transactions.type, 'income'))
    .groupBy(transactions.account_id);

  const expenseSums = await db
    .select({ account_id: transactions.account_id, total: sum(transactions.amount) })
    .from(transactions)
    .where(eq(transactions.type, 'expense'))
    .groupBy(transactions.account_id);

  const incomeMap = new Map(incomeSums.map(r => [r.account_id, Number(r.total) || 0]));
  const expenseMap = new Map(expenseSums.map(r => [r.account_id, Number(r.total) || 0]));

  return accountList.map(account => ({
    ...account,
    balance: account.balance + (incomeMap.get(account.id) || 0) - (expenseMap.get(account.id) || 0),
  }));
}

/**
 * Get account by ID
 */
export async function getAccountById(id: number) {
  const db = getDb();
  return db
    .select()
    .from(accounts)
    .where(eq(accounts.id, id))
    .then((results) => results[0] || null);
}

/**
 * Create account
 */
export async function createAccount(
  account: NewAccount
): Promise<typeof accounts.$inferSelect> {
  const db = getDb();
  const result = await db
    .insert(accounts)
    .values(account)
    .returning();
  return result[0];
}

/**
 * Update account
 */
export async function updateAccount(
  id: number,
  updates: Partial<NewAccount>
) {
  const db = getDb();
  const result = await db
    .update(accounts)
    .set({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .where(eq(accounts.id, id))
    .returning();
  return result[0];
}

/**
 * Delete account (only if no associated transactions)
 */
export async function deleteAccount(id: number) {
  const db = getDb();

  const associatedTransactions = await db
    .select({ count: count() })
    .from(transactions)
    .where(eq(transactions.account_id, id));

  if ((associatedTransactions[0]?.count ?? 0) > 0) {
    throw new Error(
      'Cannot delete account with associated transactions'
    );
  }

  await db.delete(accounts).where(eq(accounts.id, id));
}

/**
 * Initialize default account if none exists
 */
export async function ensureDefaultAccount() {
  try {
    const existingAccounts = await getAccounts();
    if (existingAccounts.length === 0) {
      await createAccount({
        name: 'Main Account',
        type: 'checking',
        balance: 0,
        currency: 'USD',
        icon: 'wallet',
        color: '#246BFD',
      });
    }
  } catch (error) {
    logger.error('Failed to ensure default account', error);
  }
}

/**
 * REPORT / INSIGHTS QUERIES
 */

export interface CategoryExpense {
  categoryId: number;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  total: number;
}

/** Expenses grouped by category for a date range */
export async function getExpenseByCategory(
  startDate: string,
  endDate: string
): Promise<CategoryExpense[]> {
  const db = getDb();
  const rows = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      total: sum(transactions.amount),
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.category_id, categories.id))
    .where(
      and(
        eq(transactions.type, 'expense'),
        between(transactions.date, startDate, endDate)
      )
    )
    .groupBy(categories.id)
    .orderBy(desc(sum(transactions.amount)));

  return rows
    .filter(r => r.categoryId !== null && Number(r.total) > 0)
    .map(r => ({
      categoryId: r.categoryId!,
      categoryName: r.categoryName ?? 'Unknown',
      categoryIcon: r.categoryIcon,
      categoryColor: r.categoryColor,
      total: Number(r.total) || 0,
    }));
}

export interface MonthlyTotals {
  month: string; // "Jan", "Feb" etc.
  year: number;
  income: number;
  expense: number;
}

/** Last N months income vs expense totals */
export async function getMonthlyTotals(months = 6): Promise<MonthlyTotals[]> {
  const db = getDb();
  const rows = await db
    .select({
      date: transactions.date,
      type: transactions.type,
      amount: transactions.amount,
    })
    .from(transactions)
    .orderBy(asc(transactions.date));

  // Group in JS — SQLite strftime grouping is simpler this way
  const map = new Map<string, { income: number; expense: number }>();
  for (const row of rows) {
    const key = row.date.slice(0, 7); // "YYYY-MM"
    if (!map.has(key)) map.set(key, { income: 0, expense: 0 });
    const entry = map.get(key)!;
    if (row.type === 'income') entry.income += row.amount;
    else entry.expense += row.amount;
  }

  const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const result: MonthlyTotals[] = [];
  for (const [key, val] of map.entries()) {
    const [y, m] = key.split('-');
    result.push({
      month: SHORT_MONTHS[parseInt(m) - 1],
      year: parseInt(y),
      income: val.income,
      expense: val.expense,
    });
  }

  // Sort chronologically using the original YYYY-MM key, then slice
  const keyed = Array.from(map.entries()).map(([key, val]) => {
    const [y, m] = key.split('-');
    return {
      key,
      month: SHORT_MONTHS[parseInt(m) - 1],
      year: parseInt(y),
      income: val.income,
      expense: val.expense,
    };
  });
  keyed.sort((a, b) => a.key.localeCompare(b.key));
  return keyed.slice(-months).map(({ key: _k, ...rest }) => rest);
}

export interface DailySpend {
  day: number; // 1-31
  amount: number;
}

/** Daily expense totals for a month */
export async function getDailySpending(
  startDate: string,
  endDate: string
): Promise<DailySpend[]> {
  const db = getDb();
  const rows = await db
    .select({
      date: transactions.date,
      amount: transactions.amount,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.type, 'expense'),
        between(transactions.date, startDate, endDate)
      )
    );

  const map = new Map<number, number>();
  for (const row of rows) {
    const day = parseInt(row.date.split('-')[2]);
    map.set(day, (map.get(day) || 0) + row.amount);
  }

  return Array.from(map.entries())
    .map(([day, amount]) => ({ day, amount }))
    .sort((a, b) => a.day - b.day);
}

/**
 * SAVINGS GOAL QUERIES
 */

/** Get all savings goals ordered by creation date */
export async function getSavingsGoals() {
  const db = getDb();
  return db.select().from(savingsGoals).orderBy(asc(savingsGoals.id));
}

/** Create a new savings goal */
export async function createSavingsGoal(
  goal: NewSavingsGoal
): Promise<typeof savingsGoals.$inferSelect> {
  const db = getDb();
  const result = await db.insert(savingsGoals).values(goal).returning();
  return result[0];
}

/** Update a savings goal */
export async function updateSavingsGoal(
  id: number,
  updates: Partial<NewSavingsGoal>
) {
  const db = getDb();
  const result = await db
    .update(savingsGoals)
    .set({ ...updates, updated_at: new Date().toISOString() })
    .where(eq(savingsGoals.id, id))
    .returning();
  return result[0];
}

/** Delete a savings goal */
export async function deleteSavingsGoal(id: number) {
  const db = getDb();
  await db.delete(savingsGoals).where(eq(savingsGoals.id, id));
}

// ─── HOUSEHOLD BUDGET QUERIES ────────────────────────────────────────────────

/** Get the single household config row, or null if not set up yet */
export async function getHouseholdConfig() {
  const db = getDb();
  const rows = await db.select().from(householdConfig).limit(1);
  return rows[0] ?? null;
}

/** Create config on first setup, update it on subsequent edits.
 *  anchor_day is derived from the chosen start date's day-of-month so monthly/yearly
 *  cycles can recover the intended day after a short month clamps it (31 → Feb 28 → Mar 31). */
export async function upsertHouseholdConfig(
  data: Omit<NewHouseholdConfig, 'id' | 'created_at' | 'updated_at' | 'anchor_day'>,
) {
  const db = getDb();
  const existing = await getHouseholdConfig();
  const now = new Date().toISOString();
  const anchor_day = parseInt(data.period_start_date.slice(8, 10), 10) || 1;
  if (existing) {
    const result = await db
      .update(householdConfig)
      .set({ ...data, anchor_day, updated_at: now })
      .where(eq(householdConfig.id, existing.id))
      .returning();
    return result[0];
  }
  const result = await db
    .insert(householdConfig)
    .values({ ...data, anchor_day, created_at: now, updated_at: now })
    .returning();
  return result[0];
}

/** Update the period start date when user resets/starts a new period */
export async function resetHouseholdPeriod(newStartDate: string) {
  const db = getDb();
  const existing = await getHouseholdConfig();
  if (!existing) return;
  await db
    .update(householdConfig)
    .set({ period_start_date: newStartDate, updated_at: new Date().toISOString() })
    .where(eq(householdConfig.id, existing.id));
}

export interface HouseholdExpenseWithCategory {
  id: number;
  amount: number;
  date: string;
  notes: string | null;
  created_at: string;
  category_id: number | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
}

/** Get household expenses within the given date range, newest first */
export async function getHouseholdExpenses(startDate: string, endDate: string): Promise<HouseholdExpenseWithCategory[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: householdExpenses.id,
      amount: householdExpenses.amount,
      date: householdExpenses.date,
      notes: householdExpenses.notes,
      created_at: householdExpenses.created_at,
      category_id: householdExpenses.category_id,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
    })
    .from(householdExpenses)
    .leftJoin(categories, eq(householdExpenses.category_id, categories.id))
    .where(and(gte(householdExpenses.date, startDate), lte(householdExpenses.date, endDate)))
    .orderBy(desc(householdExpenses.date), desc(householdExpenses.id));
  return rows;
}

/** Add a new household expense */
export async function createHouseholdExpense(data: Omit<NewHouseholdExpense, 'id' | 'created_at'>) {
  const db = getDb();
  const result = await db
    .insert(householdExpenses)
    .values({ ...data, created_at: new Date().toISOString() })
    .returning();
  return result[0];
}

/** Edit an existing household expense */
export async function updateHouseholdExpense(id: number, data: Partial<Omit<NewHouseholdExpense, 'id' | 'created_at'>>) {
  const db = getDb();
  const result = await db
    .update(householdExpenses)
    .set(data)
    .where(eq(householdExpenses.id, id))
    .returning();
  return result[0];
}

/** Remove a household expense */
export async function deleteHouseholdExpense(id: number) {
  const db = getDb();
  await db.delete(householdExpenses).where(eq(householdExpenses.id, id));
}

/** Find and delete the income transaction that was created for a household transfer */
export async function deleteLinkedTransferTransaction(date: string, amount: number) {
  const db = getDb();
  await db.delete(transactions).where(
    and(
      eq(transactions.date, date),
      eq(transactions.amount, amount),
      eq(transactions.type, 'income'),
      eq(transactions.notes, 'Household budget transfer'),
    )
  );
}

/** Find and delete the household expense that was created for a transfer — reverse link */
export async function deleteLinkedHouseholdTransferExpense(date: string, amount: number) {
  const db = getDb();
  await db.delete(householdExpenses).where(
    and(
      eq(householdExpenses.date, date),
      eq(householdExpenses.amount, amount),
      like(householdExpenses.notes, 'transfer-out:%'),
    )
  );
}

/** Delete ALL expenses in a given date range — called after a transfer to reset the period */
export async function clearHouseholdExpensesByRange(startDate: string, endDate: string) {
  const db = getDb();
  await db
    .delete(householdExpenses)
    .where(and(gte(householdExpenses.date, startDate), lte(householdExpenses.date, endDate)));
}

/** Archive a household period summary into history (idempotent on start+end). */
export async function archiveHouseholdPeriod(entry: {
  period: 'monthly' | 'weekly' | 'yearly';
  start_date: string;
  end_date: string;
  income_amount: number;
  spent_amount: number;
  remaining_amount: number;
  expense_count: number;
}) {
  const db = getDb();
  const existing = await db
    .select({ id: householdPeriodsHistory.id })
    .from(householdPeriodsHistory)
    .where(
      and(
        eq(householdPeriodsHistory.start_date, entry.start_date),
        eq(householdPeriodsHistory.end_date, entry.end_date),
      ),
    )
    .limit(1);
  if (existing[0]) {
    await db
      .update(householdPeriodsHistory)
      .set({
        income_amount: entry.income_amount,
        spent_amount: entry.spent_amount,
        remaining_amount: entry.remaining_amount,
        expense_count: entry.expense_count,
        period: entry.period,
      })
      .where(eq(householdPeriodsHistory.id, existing[0].id));
    return;
  }
  await db.insert(householdPeriodsHistory).values({
    period: entry.period,
    start_date: entry.start_date,
    end_date: entry.end_date,
    income_amount: entry.income_amount,
    spent_amount: entry.spent_amount,
    remaining_amount: entry.remaining_amount,
    expense_count: entry.expense_count,
    created_at: new Date().toISOString(),
  });
}

/** List archived household periods, newest first */
export async function listHouseholdHistory() {
  const db = getDb();
  return db
    .select()
    .from(householdPeriodsHistory)
    .orderBy(desc(householdPeriodsHistory.start_date), desc(householdPeriodsHistory.id));
}

/** Remove an archived household period entry by id */
export async function deleteHouseholdHistoryEntry(id: number) {
  const db = getDb();
  await db.delete(householdPeriodsHistory).where(eq(householdPeriodsHistory.id, id));
}

// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// LOAN QUERIES
// ─────────────────────────────────────────────────────────────────────────────

export interface LoanWithDetails {
  id: number;
  type: 'given' | 'taken';
  person_name: string;
  amount: number;
  account_id: number;
  transaction_id: number | null;
  date: string;
  due_date: string | null;
  notes: string | null;
  is_settled: number;
  created_at: string;
  updated_at: string;
  accountName: string;
  accountIcon: string | null;
  accountColor: string | null;
  payments: Array<{ id: number; amount: number; date: string; notes: string | null; created_at: string }>;
  settled_amount: number;
  remaining_amount: number;
}

/**
 * Ensure "Loan Given" (expense) and "Loan Received" (income) system categories exist.
 * Returns their IDs for use when creating loan transactions.
 */
export async function ensureSystemLoanCategories(): Promise<{ expenseCategoryId: number; incomeCategoryId: number }> {
  const db = getDb();

  const existing = await db
    .select({ id: categories.id, name: categories.name, type: categories.type })
    .from(categories)
    .where(and(like(categories.name, 'Loan %')));

  let expenseCategoryId: number | null = null;
  let incomeCategoryId: number | null = null;

  for (const cat of existing) {
    if (cat.name === 'Loan Given' && cat.type === 'expense') expenseCategoryId = cat.id;
    if (cat.name === 'Loan Received' && cat.type === 'income') incomeCategoryId = cat.id;
  }

  if (!expenseCategoryId) {
    await db
      .insert(categories)
      .values({ name: 'Loan Given', type: 'expense', icon: 'cash-outline', color: '#F59E0B' })
      .onConflictDoNothing();
    const result = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.name, 'Loan Given'))
      .limit(1);
    expenseCategoryId = result[0].id;
  }

  if (!incomeCategoryId) {
    await db
      .insert(categories)
      .values({ name: 'Loan Received', type: 'income', icon: 'cash-outline', color: '#10B981' })
      .onConflictDoNothing();
    const result = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.name, 'Loan Received'))
      .limit(1);
    incomeCategoryId = result[0].id;
  }

  return { expenseCategoryId, incomeCategoryId };
}

/** Fetch all loans with account info and payments, optionally filtered by type / settled status */
export async function getLoans(filters?: { type?: 'given' | 'taken'; isSettled?: boolean }): Promise<LoanWithDetails[]> {
  const db = getDb();

  const conditions = [];
  if (filters?.type) conditions.push(eq(loans.type, filters.type));
  if (filters?.isSettled !== undefined) conditions.push(eq(loans.is_settled, filters.isSettled ? 1 : 0));

  const rows = await db.query.loans.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      account: true,
      payments: { orderBy: (p, { asc: a }) => [a(p.date)] },
    },
    orderBy: (l, { desc: d }) => [d(l.date), d(l.id)],
  });

  return rows.map((loan) => {
    const settled_amount = loan.payments.reduce((sum, p) => sum + p.amount, 0);
    return {
      id: loan.id,
      type: loan.type,
      person_name: loan.person_name,
      amount: loan.amount,
      account_id: loan.account_id,
      transaction_id: loan.transaction_id ?? null,
      date: loan.date,
      due_date: loan.due_date ?? null,
      notes: loan.notes ?? null,
      is_settled: loan.is_settled,
      created_at: loan.created_at,
      updated_at: loan.updated_at,
      accountName: loan.account?.name ?? '',
      accountIcon: loan.account?.icon ?? null,
      accountColor: loan.account?.color ?? null,
      payments: loan.payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        date: p.date,
        notes: p.notes ?? null,
        created_at: p.created_at,
      })),
      settled_amount,
      remaining_amount: Math.max(0, loan.amount - settled_amount),
    };
  });
}

/** Create a loan record. No transaction is created — balance only changes on "Transfer to Account". */
export async function createLoan(
  data: Omit<NewLoan, 'id' | 'transaction_id' | 'created_at' | 'updated_at'>,
  _categoryIds: { expenseCategoryId: number; incomeCategoryId: number }
): Promise<LoanWithDetails> {
  const db = getDb();

  const loanResult = await db
    .insert(loans)
    .values({
      ...data,
      transaction_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .returning();

  const loan = loanResult[0];
  const account = await db
    .select({ name: accounts.name, icon: accounts.icon, color: accounts.color })
    .from(accounts)
    .where(eq(accounts.id, loan.account_id));

  return {
    ...loan,
    accountName: account[0]?.name ?? '',
    accountIcon: account[0]?.icon ?? null,
    accountColor: account[0]?.color ?? null,
    payments: [],
    settled_amount: 0,
    remaining_amount: loan.amount,
  };
}

/** Update loan fields (person_name, due_date, notes, is_settled) */
export async function updateLoan(id: number, updates: Partial<Pick<NewLoan, 'person_name' | 'due_date' | 'notes' | 'is_settled'>>) {
  const db = getDb();
  const result = await db
    .update(loans)
    .set({ ...updates, updated_at: new Date().toISOString() })
    .where(eq(loans.id, id))
    .returning();
  return result[0];
}

/** Delete a loan record, its payments, and its linked transfer transaction if present. */
export async function deleteLoan(id: number): Promise<void> {
  const db = getDb();
  const [loan] = await db
    .select({ transaction_id: loans.transaction_id })
    .from(loans)
    .where(eq(loans.id, id))
    .limit(1);
  // Delete the transfer transaction first (FK will set loan.transaction_id to null)
  if (loan?.transaction_id) {
    await db.delete(transactions).where(eq(transactions.id, loan.transaction_id));
  }
  await db.delete(loans).where(eq(loans.id, id));
}

/**
 * Record a repayment amount against a loan (progress tracking only — no transaction created).
 * Balance only changes when the user explicitly taps "Transfer to Account".
 * Auto-settles the loan when fully paid.
 */
export async function createLoanPayment(
  data: Omit<NewLoanPayment, 'id' | 'transaction_id' | 'created_at'>,
  loan: Pick<LoanWithDetails, 'id' | 'type' | 'person_name' | 'account_id' | 'amount' | 'settled_amount'>,
  _categoryIds: { expenseCategoryId: number; incomeCategoryId: number }
): Promise<void> {
  const db = getDb();

  await db.transaction(async (tx) => {
    await tx
      .insert(loanPayments)
      .values({ ...data, transaction_id: null, created_at: new Date().toISOString() });

    const newSettled = loan.settled_amount + data.amount;
    if (newSettled >= loan.amount) {
      await tx
        .update(loans)
        .set({ is_settled: 1, updated_at: new Date().toISOString() })
        .where(eq(loans.id, loan.id));
    }
  });
}

/**
 * Transfer a settled loan to the account: creates one transaction that shows in Activity
 * and affects the account balance. For given loans → income; for taken loans → expense.
 * Sets loan.transaction_id so the button becomes "Transferred" afterward.
 */
export async function transferLoanToAccount(
  loanId: number,
  categoryIds: { expenseCategoryId: number; incomeCategoryId: number }
): Promise<void> {
  const db = getDb();

  const [loan] = await db
    .select()
    .from(loans)
    .where(eq(loans.id, loanId))
    .limit(1);
  if (!loan) throw new Error('Loan not found');

  const txType = loan.type === 'given' ? 'income' : 'expense';
  const catId = loan.type === 'given'
    ? categoryIds.incomeCategoryId
    : categoryIds.expenseCategoryId;

  await db.transaction(async (tx) => {
    const txResult = await tx
      .insert(transactions)
      .values({
        category_id: catId,
        account_id: loan.account_id,
        amount: loan.amount,
        type: txType,
        date: new Date().toISOString().split('T')[0],
        notes: loan.type === 'given'
          ? `Loan repaid by ${loan.person_name}`
          : `Loan repaid to ${loan.person_name}`,
      })
      .returning();

    await tx
      .update(loans)
      .set({
        transaction_id: txResult[0].id,
        is_settled: 1,
        updated_at: new Date().toISOString(),
      })
      .where(eq(loans.id, loanId));
  });
}

/** Monthly equivalent of all active recurring expenses */
export async function getRecurringMonthlyTotal(): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({
      amount: recurringExpenses.amount,
      frequency: recurringExpenses.frequency,
    })
    .from(recurringExpenses)
    .leftJoin(categories, eq(recurringExpenses.category_id, categories.id))
    .where(
      and(
        eq(recurringExpenses.is_active, 1),
        eq(categories.type, 'expense')
      )
    );

  const MULTIPLIERS: Record<string, number> = {
    daily: 30,
    weekly: 4.33,
    monthly: 1,
    yearly: 1 / 12,
  };

  return rows.reduce((sum, r) => {
    const mult = MULTIPLIERS[r.frequency] ?? 1;
    return sum + r.amount * mult;
  }, 0);
}
