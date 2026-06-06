/**
 * Database Type Definitions
 * Type-safe database models and schemas
 */

export type TransactionType = 'income' | 'expense';
export type AccountType = 'checking' | 'savings' | 'credit' | 'cash' | 'other';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface Category extends BaseEntity {
  name: string;
  type: TransactionType;
  payment_method?: string | null;
  icon?: string | null;
  color?: string | null;
}

export interface Account extends BaseEntity {
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  icon?: string | null;
  color?: string | null;
}

export interface Transaction extends BaseEntity {
  category_id: number;
  account_id: number;
  amount: number;
  type: TransactionType;
  date: string;
  notes?: string | null;
  receipt?: string | null;
  recurring_id?: number | null;
}

export interface RecurringExpense extends BaseEntity {
  category_id: number;
  account_id: number;
  amount: number;
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string | null;
  notes?: string | null;
  is_active: number;
  last_processed?: string | null;
}

export interface Budget extends BaseEntity {
  category_id?: number | null;
  amount: number;
  period: BudgetPeriod;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  is_active: number;
  alert_threshold: number;
}

export type LoanType = 'given' | 'taken';

export interface LoanPaymentEntry {
  id: number;
  amount: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface LoanWithDetails extends BaseEntity {
  type: LoanType;
  person_name: string;
  amount: number;
  account_id: number;
  transaction_id: number | null;
  date: string;
  due_date: string | null;
  notes: string | null;
  is_settled: number;
  accountName: string;
  accountIcon: string | null;
  accountColor: string | null;
  payments: LoanPaymentEntry[];
  settled_amount: number;
  remaining_amount: number;
}

export type { Category as CategoryType };
export type { Account as AccountEntityType };
export type { Transaction as TransactionEntityType };
export type { RecurringExpense as RecurringExpenseType };
export type { Budget as BudgetType };
