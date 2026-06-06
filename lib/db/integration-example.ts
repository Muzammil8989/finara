/**
 * INTEGRATION EXAMPLE
 * Shows how to use the database schema in real application code
 * Examples for common finance app use cases
 */

import {
  // Database initialization
  initializeDb,
  getDb,
  getRawDb,
  closeDb,
} from './db-client';

// Import all query functions
import {
  // Transactions
  createTransaction,
  getTransactions,
  getTransactionsByDateRange,
  getSummaryByDateRange,
  updateTransaction,
  deleteTransaction,
  // Categories
  getCategories,
  createCategory,
  updateCategory,
  // Accounts
  getAccounts,
  getDefaultAccount,
  createAccount,
  updateAccountBalance,
  // Recurring
  getActiveRecurringExpenses,
  createRecurringExpense,
  // Budgets
  getActiveBudgets,
  createBudget,
  // Advanced
  getDashboardSummary,
  getSpendingByCategory,
  getDailySpendingTrend,
  getAccountsSummary,
  getMonthlyComparison,
} from './queries';

import { advanced } from './advanced-queries';

// --- EXAMPLE 1: Initialize App ---

export async function initializeApplication() {
  try {
    console.log('Starting Wealthflow app...');

    // Initialize database with migrations and seeding
    await initializeDb();

    console.log('✅ Database initialized successfully');
    console.log('✅ App ready for use');
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    throw error;
  }
}

// --- EXAMPLE 2: Record a Transaction ---

export async function recordExpense() {
  try {
    // Get default account
    const account = await getDefaultAccount();
    if (!account) throw new Error('No default account found');

    // Get Food category
    const categories = await getCategories('expense');
    const foodCategory = categories.find((c) => c.name === 'Food & Dining');
    if (!foodCategory) throw new Error('Food category not found');

    // Create transaction
    const transaction = await createTransaction({
      account_id: account.id,
      category_id: foodCategory.id,
      amount: 25.50,
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      notes: 'Lunch at Italian restaurant',
    });

    console.log('✅ Expense recorded:', transaction);
    return transaction;
  } catch (error) {
    console.error('❌ Error recording expense:', error);
    throw error;
  }
}

// --- EXAMPLE 3: Get Monthly Summary ---

export async function getMonthlyFinancialSummary(
  year: number,
  month: number
) {
  try {
    // Calculate date range
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const startDate = firstDay.toISOString().split('T')[0];
    const endDate = lastDay.toISOString().split('T')[0];

    // Get overall summary
    const summary = await getSummaryByDateRange(startDate, endDate);

    // Get spending by category (for pie chart)
    const spendingByCategory = await getSpendingByCategory(
      startDate,
      endDate
    );

    // Get account summary
    const accountsSummary = await getAccountsSummary();

    return {
      period: `${year}-${String(month).padStart(2, '0')}`,
      summary: {
        income: summary.find((s) => s.type === 'income')?.total ?? 0,
        expense: summary.find((s) => s.type === 'expense')?.total ?? 0,
        net:
          (summary.find((s) => s.type === 'income')?.total ?? 0) -
          (summary.find((s) => s.type === 'expense')?.total ?? 0),
      },
      spendingByCategory,
      accounts: accountsSummary,
    };
  } catch (error) {
    console.error('❌ Error getting monthly summary:', error);
    throw error;
  }
}

// --- EXAMPLE 4: Create Budget ---

export async function setupBudget() {
  try {
    // Get Food category
    const categories = await getCategories('expense');
    const foodCategory = categories.find((c) => c.name === 'Food & Dining');
    if (!foodCategory) throw new Error('Food category not found');

    // Create monthly budget for Food
    const budget = await createBudget({
      category_id: foodCategory.id,
      amount: 500.00,
      period: 'monthly',
      alert_threshold: 80,
      notes: 'Monthly food budget limit',
    });

    console.log('✅ Budget created:', budget);
    return budget;
  } catch (error) {
    console.error('❌ Error creating budget:', error);
    throw error;
  }
}

// --- EXAMPLE 5: Setup Recurring Expense ---

export async function setupRecurringExpense() {
  try {
    // Get Utilities category
    const categories = await getCategories('expense');
    const utilitiesCategory = categories.find((c) => c.name === 'Utilities');
    if (!utilitiesCategory) throw new Error('Utilities category not found');

    // Get default account
    const account = await getDefaultAccount();
    if (!account) throw new Error('No default account found');

    // Create monthly electricity bill
    const recurring = await createRecurringExpense({
      category_id: utilitiesCategory.id,
      account_id: account.id,
      amount: 120.00,
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      notes: 'Monthly electricity bill',
    });

    console.log('✅ Recurring expense created:', recurring);
    return recurring;
  } catch (error) {
    console.error('❌ Error creating recurring expense:', error);
    throw error;
  }
}

// --- EXAMPLE 6: Add Custom Category ---

export async function addCustomCategory() {
  try {
    const newCategory = await createCategory({
      name: 'Subscriptions',
      type: 'expense',
      icon: 'refresh',
      color: '#FF6B6B',
    });

    console.log('✅ Custom category created:', newCategory);
    return newCategory;
  } catch (error) {
    console.error('❌ Error creating category:', error);
    throw error;
  }
}

// --- EXAMPLE 7: Add New Account ---

export async function addNewAccount() {
  try {
    const newAccount = await createAccount({
      name: 'Credit Card',
      type: 'credit_card',
      balance: 0,
      color: '#4DABF7',
      icon: 'credit-card',
      is_default: 0,
    });

    console.log('✅ New account created:', newAccount);
    return newAccount;
  } catch (error) {
    console.error('❌ Error creating account:', error);
    throw error;
  }
}

// --- EXAMPLE 8: Get Dashboard Data ---

export async function getDashboardData() {
  try {
    // Get current month dates
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startDate = firstDay.toISOString().split('T')[0];
    const endDate = lastDay.toISOString().split('T')[0];

    // Get dashboard summary
    const dashboard = await getDashboardSummary(startDate, endDate);

    // Get daily trend
    const dailyTrend = await getDailySpendingTrend(startDate, endDate);

    // Get spending by category
    const categories = await getSpendingByCategory(startDate, endDate);

    // Get active budgets
    const budgets = await getActiveBudgets();

    return {
      summary: dashboard,
      dailyTrend,
      categoryBreakdown: categories,
      budgets,
    };
  } catch (error) {
    console.error('❌ Error getting dashboard data:', error);
    throw error;
  }
}

// --- EXAMPLE 9: Compare Months ---

export async function compareLastTwoMonths() {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Current month
    const currentFirst = new Date(currentYear, currentMonth, 1);
    const currentLast = new Date(currentYear, currentMonth + 1, 0);
    const currentStart = currentFirst.toISOString().split('T')[0];
    const currentEnd = currentLast.toISOString().split('T')[0];

    // Previous month
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevFirst = new Date(prevYear, prevMonth, 1);
    const prevLast = new Date(prevYear, prevMonth + 1, 0);
    const prevStart = prevFirst.toISOString().split('T')[0];
    const prevEnd = prevLast.toISOString().split('T')[0];

    // Get comparison
    const comparison = await getMonthlyComparison(
      currentStart,
      currentEnd,
      prevStart,
      prevEnd
    );

    console.log('✅ Monthly comparison:', comparison);
    return comparison;
  } catch (error) {
    console.error('❌ Error comparing months:', error);
    throw error;
  }
}

// --- EXAMPLE 10: Search Transactions ---

export async function searchRecentTransactions() {
  try {
    // Get last 30 days of transactions
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const transactions = await getTransactionsByDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    console.log(`✅ Found ${transactions.length} transactions in last 30 days`);
    return transactions;
  } catch (error) {
    console.error('❌ Error searching transactions:', error);
    throw error;
  }
}

// --- EXAMPLE 11: Update Transaction ---

export async function editTransaction(
  transactionId: number,
  updates: {
    amount?: number;
    notes?: string;
    date?: string;
  }
) {
  try {
    const updated = await updateTransaction(transactionId, updates);
    console.log('✅ Transaction updated:', updated);
    return updated;
  } catch (error) {
    console.error('❌ Error updating transaction:', error);
    throw error;
  }
}

// --- EXAMPLE 12: Update Account Balance ---

export async function syncAccountBalance(
  accountId: number,
  newBalance: number
) {
  try {
    const updated = await updateAccountBalance(accountId, newBalance);
    console.log('✅ Account balance updated:', updated);
    return updated;
  } catch (error) {
    console.error('❌ Error updating account balance:', error);
    throw error;
  }
}

// --- EXAMPLE 13: React Hook Usage ---

/**
 * Example React hook for using database in components
 */
export function useTransactionData(year: number, month: number) {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await getMonthlyFinancialSummary(year, month);
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [year, month]);

  return { loading, data, error };
}

// Placeholder for React import in non-React files
// import React from 'react';

// --- EXAMPLE 14: Export Data for Backup ---

export async function exportAllData() {
  try {
    const transactions = await getTransactions({ limit: 10000 });
    const categories = await getCategories();
    const accounts = await getAccounts();
    const recurring = await getActiveRecurringExpenses();
    const budgets = await getActiveBudgets();

    const backup = {
      exportDate: new Date().toISOString(),
      transactions,
      categories,
      accounts,
      recurringExpenses: recurring,
      budgets,
    };

    console.log('✅ Data exported for backup');
    return backup;
  } catch (error) {
    console.error('❌ Error exporting data:', error);
    throw error;
  }
}

// --- EXAMPLE 15: Cleanup ---

export async function shutdownApplication() {
  try {
    await closeDb();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database:', error);
    throw error;
  }
}

/**
 * USAGE IN APP LAYOUT
 *
 * Example of how to use these in your React Native app:
 *
 * ```typescript
 * // In app/_layout.tsx
 * import { initializeApplication, shutdownApplication } from '@/lib/db/integration-example';
 *
 * export default function RootLayout() {
 *   useEffect(() => {
 *     // Initialize on app start
 *     initializeApplication();
 *
 *     return () => {
 *       // Cleanup on app close
 *       shutdownApplication();
 *     };
 *   }, []);
 *
 *   // ... rest of layout
 * }
 * ```
 *
 * USAGE IN SCREENS
 *
 * ```typescript
 * // In a transaction screen
 * import { recordExpense } from '@/lib/db/integration-example';
 *
 * async function handleAddExpense() {
 *   const transaction = await recordExpense();
 *   // Update UI...
 * }
 * ```
 */
