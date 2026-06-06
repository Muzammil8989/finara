import { getDb } from './db-client';
import {
  categories,
  accounts,
  transactions,
  recurringExpenses,
  budgets,
} from './schema';
import {
  eq,
  desc,
  asc,
  between,
  and,
  or,
  lte,
  like,
  sum,
  count,
  avg,
  max,
  min,
} from 'drizzle-orm';

/**
 * ADVANCED QUERIES
 * Complex queries for analytics, reporting, and insights
 */

/**
 * Get spending by category for a date range
 * Useful for pie charts and category breakdown
 */
export async function getSpendingByCategory(
  startDate: string,
  endDate: string,
  accountId?: number
) {
  const db = getDb();
  const conditions = [
    between(transactions.date, startDate, endDate),
    eq(transactions.type, 'expense'),
  ];

  if (accountId) {
    conditions.push(eq(transactions.account_id, accountId));
  }

  return db
    .select({
      category_id: transactions.category_id,
      category_name: categories.name,
      category_color: categories.color,
      category_icon: categories.icon,
      total_spent: sum(transactions.amount),
      transaction_count: count(transactions.id),
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.category_id, categories.id))
    .where(and(...conditions))
    .groupBy(transactions.category_id)
    .orderBy(desc(sum(transactions.amount)));
}

/**
 * Get daily spending trend
 * Useful for line charts showing spending over time
 */
export async function getDailySpendingTrend(
  startDate: string,
  endDate: string,
  accountId?: number
) {
  const db = getDb();
  const baseConditions = [between(transactions.date, startDate, endDate)];

  if (accountId) {
    baseConditions.push(eq(transactions.account_id, accountId));
  }

  // Get income by date
  const incomeByDate = await db
    .select({
      date: transactions.date,
      total: sum(transactions.amount),
    })
    .from(transactions)
    .where(and(eq(transactions.type, 'income'), ...baseConditions))
    .groupBy(transactions.date)
    .orderBy(asc(transactions.date));

  // Get expense by date
  const expenseByDate = await db
    .select({
      date: transactions.date,
      total: sum(transactions.amount),
    })
    .from(transactions)
    .where(and(eq(transactions.type, 'expense'), ...baseConditions))
    .groupBy(transactions.date)
    .orderBy(asc(transactions.date));

  // Combine results
  const allDates = new Set([
    ...incomeByDate.map((x) => x.date),
    ...expenseByDate.map((x) => x.date),
  ]);

  const combined = Array.from(allDates)
    .sort()
    .map((date) => ({
      date,
      income: (incomeByDate.find((x) => x.date === date)?.total as unknown as number) ?? 0,
      expense: (expenseByDate.find((x) => x.date === date)?.total as unknown as number) ?? 0,
    }));

  return combined;
}

/**
 * Get account balances with calculated net worth
 * Includes transaction counts and recent activity
 */
export async function getAccountsSummary() {
  const db = getDb();

  const accountData = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      type: accounts.type,
      balance: accounts.balance,
      color: accounts.color,
      icon: accounts.icon,
      transaction_count: count(transactions.id),
      last_transaction_date: max(transactions.date),
    })
    .from(accounts)
    .leftJoin(transactions, eq(accounts.id, transactions.account_id))
    .groupBy(accounts.id)
    .orderBy(asc(accounts.name));

  // Calculate total net worth
  const totalBalance = accountData.reduce(
    (sum, account) => sum + (account.balance || 0),
    0
  );

  return {
    accounts: accountData,
    totalNetWorth: totalBalance,
    accountCount: accountData.length,
  };
}

/**
 * Get category statistics for analysis
 * Average transaction size, frequency, total transactions
 */
export async function getCategoryStatistics(
  startDate: string,
  endDate: string
) {
  const db = getDb();

  return db
    .select({
      category_id: transactions.category_id,
      category_name: categories.name,
      category_type: categories.type,
      total_transactions: count(transactions.id),
      total_amount: sum(transactions.amount),
      average_amount: avg(transactions.amount),
      min_amount: min(transactions.amount),
      max_amount: max(transactions.amount),
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.category_id, categories.id))
    .where(between(transactions.date, startDate, endDate))
    .groupBy(transactions.category_id)
    .orderBy(desc(sum(transactions.amount)));
}

/**
 * Get monthly comparison (current month vs previous month)
 * Useful for comparing spending trends
 */
export async function getMonthlyComparison(
  currentMonthStart: string,
  currentMonthEnd: string,
  previousMonthStart: string,
  previousMonthEnd: string,
  accountId?: number
) {
  const db = getDb();

  const buildQuery = (startDate: string, endDate: string) => {
    const conditions = [between(transactions.date, startDate, endDate)];

    if (accountId) {
      conditions.push(eq(transactions.account_id, accountId));
    }

    return db
      .select({
        type: transactions.type,
        total: sum(transactions.amount),
        count: count(transactions.id),
      })
      .from(transactions)
      .where(and(...conditions))
      .groupBy(transactions.type);
  };

  const current = await buildQuery(currentMonthStart, currentMonthEnd);
  const previous = await buildQuery(previousMonthStart, previousMonthEnd);

  const currentIncome = (current.find((x) => x.type === 'income')?.total as unknown as number) ?? 0;
  const currentExpense = (current.find((x) => x.type === 'expense')?.total as unknown as number) ?? 0;
  const previousIncome = (previous.find((x) => x.type === 'income')?.total as unknown as number) ?? 0;
  const previousExpense = (previous.find((x) => x.type === 'expense')?.total as unknown as number) ?? 0;

  return {
    current: {
      income: currentIncome,
      expense: currentExpense,
    },
    previous: {
      income: previousIncome,
      expense: previousExpense,
    },
    changeExpense: currentExpense - previousExpense,
    changeIncome: currentIncome - previousIncome,
  };
}

/**
 * Get top categories by spending
 * Useful for identifying spending hotspots
 */
export async function getTopCategories(
  limit: number = 5,
  startDate?: string,
  endDate?: string
) {
  const db = getDb();

  const conditions = [eq(transactions.type, 'expense')];
  if (startDate && endDate) {
    conditions.push(between(transactions.date, startDate, endDate));
  }

  return db
    .select({
      category_id: transactions.category_id,
      category_name: categories.name,
      category_icon: categories.icon,
      total_spent: sum(transactions.amount),
      transaction_count: count(transactions.id),
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.category_id, categories.id))
    .where(and(...conditions))
    .groupBy(transactions.category_id)
    .orderBy(desc(sum(transactions.amount)))
    .limit(limit);
}

/**
 * Get recurring expense summary
 * Shows all active recurring expenses with next occurrence
 */
export async function getRecurringExpensesSummary() {
  const db = getDb();

  return db
    .select({
      id: recurringExpenses.id,
      category_name: categories.name,
      account_name: accounts.name,
      amount: recurringExpenses.amount,
      frequency: recurringExpenses.frequency,
      start_date: recurringExpenses.start_date,
      end_date: recurringExpenses.end_date,
      is_active: recurringExpenses.is_active,
      notes: recurringExpenses.notes,
    })
    .from(recurringExpenses)
    .leftJoin(categories, eq(recurringExpenses.category_id, categories.id))
    .leftJoin(accounts, eq(recurringExpenses.account_id, accounts.id))
    .where(eq(recurringExpenses.is_active, 1))
    .orderBy(asc(recurringExpenses.start_date));
}

/**
 * Get budget status for all active budgets
 * Shows spending vs budget limit for each budget
 */
export async function getBudgetStatus() {
  const db = getDb();

  const budgetData = await db
    .select({
      id: budgets.id,
      category_name: categories.name,
      amount: budgets.amount,
      period: budgets.period,
      alert_threshold: budgets.alert_threshold,
      start_date: budgets.start_date,
      end_date: budgets.end_date,
    })
    .from(budgets)
    .leftJoin(categories, eq(budgets.category_id, categories.id))
    .where(eq(budgets.is_active, 1));

  // For each budget, calculate current spending
  // This would need to be enhanced based on the budget period
  return budgetData;
}

/**
 * Get transactions by date range with full details
 * Includes category and account information
 */
export async function getTransactionsWithDetails(
  startDate: string,
  endDate: string,
  limit: number = 50
) {
  const db = getDb();

  return db
    .select({
      id: transactions.id,
      date: transactions.date,
      amount: transactions.amount,
      type: transactions.type,
      notes: transactions.notes,
      category_name: categories.name,
      category_icon: categories.icon,
      category_color: categories.color,
      account_name: accounts.name,
      account_type: accounts.type,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.category_id, categories.id))
    .leftJoin(accounts, eq(transactions.account_id, accounts.id))
    .where(between(transactions.date, startDate, endDate))
    .orderBy(desc(transactions.date))
    .limit(limit);
}

/**
 * Calculate account balance at a specific date
 * Includes all transactions up to and including that date
 */
export async function getAccountBalanceAtDate(
  accountId: number,
  upToDate: string
) {
  const db = getDb();

  const account = await db
    .select({ balance: accounts.balance })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .then((results) => results[0]);

  // Build base conditions
  const baseConditions = [eq(transactions.account_id, accountId)];
  if (upToDate) {
    baseConditions.push(lte(transactions.date, upToDate));
  }

  // Get income transactions
  const incomeResult = await db
    .select({
      total: sum(transactions.amount),
    })
    .from(transactions)
    .where(and(eq(transactions.type, 'income'), ...baseConditions));

  // Get expense transactions
  const expenseResult = await db
    .select({
      total: sum(transactions.amount),
    })
    .from(transactions)
    .where(and(eq(transactions.type, 'expense'), ...baseConditions));

  const initialBalance = (account?.balance as unknown as number) ?? 0;
  const income = (incomeResult[0]?.total as unknown as number) ?? 0;
  const expenses = (expenseResult[0]?.total as unknown as number) ?? 0;

  return {
    balance: initialBalance + income - expenses,
    income,
    expenses,
    initialBalance,
  };
}

/**
 * Search transactions by notes (fuzzy search support)
 */
export async function searchTransactions(
  searchTerm: string,
  limit: number = 20
) {
  const db = getDb();

  // Build search conditions - search in both notes and category name
  const searchPattern = `%${searchTerm}%`;

  return db
    .select()
    .from(transactions)
    .leftJoin(categories, eq(transactions.category_id, categories.id))
    .where(
      or(
        like(transactions.notes, searchPattern),
        like(categories.name, searchPattern)
      )
    )
    .orderBy(desc(transactions.date))
    .limit(limit);
}

/**
 * Get spending velocity (average daily spending)
 */
export async function getSpendingVelocity(
  startDate: string,
  endDate: string,
  accountId?: number
) {
  const db = getDb();

  const conditions = [
    between(transactions.date, startDate, endDate),
    eq(transactions.type, 'expense'),
  ];

  if (accountId) {
    conditions.push(eq(transactions.account_id, accountId));
  }

  const summary = await db
    .select({
      total_spent: sum(transactions.amount),
      transaction_count: count(transactions.id),
    })
    .from(transactions)
    .where(and(...conditions));

  // Calculate days between dates
  const days = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const totalSpent = (summary[0]?.total_spent as unknown as number) ?? 0;
  const transactionCount = (summary[0]?.transaction_count as unknown as number) ?? 0;
  const dailyAverage = totalSpent / days;

  return {
    totalSpent,
    transactionCount,
    daysCovered: days,
    dailyAverage,
    weeklyProjection: dailyAverage * 7,
    monthlyProjection: dailyAverage * 30,
  };
}

/**
 * Get most frequent transaction categories
 * Shows which categories have the most transactions
 */
export async function getMostFrequentCategories(
  limit: number = 10,
  startDate?: string,
  endDate?: string
) {
  const db = getDb();

  const baseQuery = db
    .select({
      category_name: categories.name,
      category_icon: categories.icon,
      transaction_count: count(transactions.id),
      total_amount: sum(transactions.amount),
      average_amount: avg(transactions.amount),
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.category_id, categories.id));

  const withDateFilter =
    startDate && endDate
      ? baseQuery.where(between(transactions.date, startDate, endDate))
      : baseQuery;

  return withDateFilter
    .groupBy(transactions.category_id)
    .orderBy(desc(count(transactions.id)))
    .limit(limit);
}

/**
 * Get financial overview/dashboard summary
 * Combines multiple metrics for dashboard display
 */
export async function getDashboardSummary(
  startDate: string,
  endDate: string
) {
  const db = getDb();

  const summary = await db
    .select({
      type: transactions.type,
      total: sum(transactions.amount),
      count: count(transactions.id),
    })
    .from(transactions)
    .where(between(transactions.date, startDate, endDate))
    .groupBy(transactions.type);

  const topCategories = await getTopCategories(5, startDate, endDate);
  const accountsData = await getAccountsSummary();

  const income = (summary.find((x) => x.type === 'income')?.total as unknown as number) ?? 0;
  const expenses = (summary.find((x) => x.type === 'expense')?.total as unknown as number) ?? 0;
  const incomeCount = (summary.find((x) => x.type === 'income')?.count as unknown as number) ?? 0;
  const expenseCount = (summary.find((x) => x.type === 'expense')?.count as unknown as number) ?? 0;
  const net = income - expenses;

  return {
    period: { startDate, endDate },
    income,
    expenses,
    net,
    savingsRate: income > 0 ? (net / income) * 100 : 0,
    topCategories,
    accountsSummary: accountsData,
    incomeCount,
    expenseCount,
  };
}
