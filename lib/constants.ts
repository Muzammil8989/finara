/** Period options used across budgets, recurring expenses */
export const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'] as const;
export type Period = typeof PERIODS[number];

export const PERIOD_LABELS: Record<Period, string> = {
    daily: 'Today',
    weekly: 'This Week',
    monthly: 'This Month',
    yearly: 'This Year',
};

export const PERIOD_MULTIPLIERS: Record<Period, number> = {
    daily: 30,
    weekly: 4.33,
    monthly: 1,
    yearly: 1 / 12,
};

/** Transaction types */
export const TRANSACTION_TYPES = ['income', 'expense'] as const;
export type TransactionType = typeof TRANSACTION_TYPES[number];

/** Input validation limits */
export const MAX_NAME_LENGTH = 50;
export const MAX_NOTES_LENGTH = 500;
export const MAX_AMOUNT = 999_999_999;
