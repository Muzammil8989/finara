# Folio Database Schema

Comprehensive Drizzle ORM TypeScript schema for SQLite offline-first personal finance tracking app.

## Overview

This database module provides:
- **Type-safe database operations** using Drizzle ORM
- **SQLite offline-first** architecture for React Native
- **Relational data model** with proper normalization
- **Database migrations** for schema evolution
- **Query helpers** for common operations
- **Performance optimizations** through strategic indexing

## Architecture

### Tables

#### 1. **Categories** (`categories`)
Stores user-defined transaction categories with type classification.

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique identifier |
| `name` | TEXT | UNIQUE, NOT NULL | Category name (e.g., "Food", "Salary") |
| `type` | TEXT | NOT NULL, CHECK('income'\|'expense') | Category classification |
| `icon` | TEXT | OPTIONAL | Icon identifier for UI |
| `color` | TEXT | OPTIONAL | Hex color code for visual distinction |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |
| `updated_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |

**Indexes:**
- `idx_categories_type`: Optimizes filtering by income/expense
- `unique_category_name_type`: Ensures category-type uniqueness

---

#### 2. **Accounts** (`accounts`)
User-defined accounts (Cash, Card, Bank, Wallet) with balance tracking.

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique identifier |
| `name` | TEXT | UNIQUE, NOT NULL | Account name (e.g., "Main Checking") |
| `type` | TEXT | NOT NULL | Account type (cash, debit_card, credit_card, bank_account, wallet) |
| `balance` | REAL | DEFAULT 0 | Current account balance |
| `description` | TEXT | OPTIONAL | Account description |
| `color` | TEXT | OPTIONAL | Hex color code |
| `icon` | TEXT | OPTIONAL | Icon identifier |
| `is_default` | INTEGER | DEFAULT 0 | Flag for default account (0=false, 1=true) |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |
| `updated_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |

**Indexes:**
- `idx_accounts_is_default`: Quick lookup of default account
- `idx_accounts_type`: Optimizes account type filtering

---

#### 3. **Transactions** (`transactions`)
Core transaction log with comprehensive tracking and relationships.

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique identifier |
| `account_id` | INTEGER | NOT NULL, FK→accounts | Associated account |
| `category_id` | INTEGER | NOT NULL, FK→categories | Associated category |
| `amount` | REAL | NOT NULL, CHECK(>0) | Transaction amount (always positive) |
| `type` | TEXT | NOT NULL, CHECK('income'\|'expense') | Transaction type |
| `date` | TEXT | NOT NULL | ISO date (YYYY-MM-DD) |
| `notes` | TEXT | OPTIONAL | User notes |
| `receipt` | TEXT | OPTIONAL | Receipt/attachment reference |
| `recurring_id` | INTEGER | OPTIONAL, FK→recurring_expenses | Source recurring expense |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |
| `updated_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |

**Indexes:**
- `idx_transactions_date`: Critical for date-range queries (monthly/weekly views)
- `idx_transactions_account_id`: Account filtering
- `idx_transactions_category_id`: Category filtering
- `idx_transactions_date_type`: Composite for income/expense summaries
- `idx_transactions_recurring_id`: Track generated transactions

**Foreign Keys:**
- `account_id` → `accounts(id)` ON DELETE RESTRICT
- `category_id` → `categories(id)` ON DELETE RESTRICT
- `recurring_id` → `recurring_expenses(id)` ON DELETE SET NULL

---

#### 4. **Recurring Expenses** (`recurring_expenses`)
Scheduled transactions (subscriptions, salaries, bills) with frequency management.

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique identifier |
| `category_id` | INTEGER | NOT NULL, FK→categories | Associated category |
| `account_id` | INTEGER | OPTIONAL, FK→accounts | Associated account |
| `amount` | REAL | NOT NULL, CHECK(>0) | Recurring amount |
| `frequency` | TEXT | NOT NULL, CHECK (daily\|weekly\|monthly\|yearly) | Recurrence frequency |
| `start_date` | TEXT | NOT NULL | ISO start date |
| `end_date` | TEXT | OPTIONAL | ISO end date (null = indefinite) |
| `notes` | TEXT | OPTIONAL | Description |
| `is_active` | INTEGER | DEFAULT 1 | Active status (0=false, 1=true) |
| `last_processed` | TEXT | OPTIONAL | Last transaction generation date |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |
| `updated_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |

**Indexes:**
- `idx_recurring_frequency`: Frequency-based queries
- `idx_recurring_is_active`: Filter active recurring expenses
- `idx_recurring_start_date`: Date-based processing
- `idx_recurring_active_dates`: Composite for finding active expenses by date

---

#### 5. **Budgets** (`budgets`)
Spending limits and budget tracking with alert thresholds.

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique identifier |
| `category_id` | INTEGER | OPTIONAL, FK→categories | Category-specific budget (null = global) |
| `amount` | REAL | NOT NULL, CHECK(>0) | Budget limit |
| `period` | TEXT | NOT NULL, CHECK (daily\|weekly\|monthly\|yearly) | Budget period |
| `start_date` | TEXT | OPTIONAL | ISO start date |
| `end_date` | TEXT | OPTIONAL | ISO end date (null = indefinite) |
| `notes` | TEXT | OPTIONAL | Description |
| `is_active` | INTEGER | DEFAULT 1 | Active status (0=false, 1=true) |
| `alert_threshold` | INTEGER | DEFAULT 80, CHECK (0-100) | Alert percentage threshold |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |
| `updated_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |

**Indexes:**
- `idx_budgets_category_id`: Category-specific budgets
- `idx_budgets_period`: Period-based queries
- `idx_budgets_is_active`: Active budget filtering
- `idx_budgets_active_period`: Composite for finding active budgets by period

---

## Database Relationships

```
categories (1) ──────→ (M) transactions
    ↓
    └──→ (M) recurring_expenses
    └──→ (M) budgets

accounts (1) ──────→ (M) transactions
    ↓
    └──→ (M) recurring_expenses

recurring_expenses (1) ──→ (M) transactions
```

## Usage Guide

### 1. Initialize Database

```typescript
import { initializeDb } from '@/lib/db/db-client';

// Call once at app startup
async function initApp() {
  await initializeDb();
}
```

### 2. Create Transactions

```typescript
import { createTransaction } from '@/lib/db/queries';

const transaction = await createTransaction({
  account_id: 1,
  category_id: 5,
  amount: 50.00,
  type: 'expense',
  date: '2024-01-15',
  notes: 'Lunch at restaurant'
});
```

### 3. Query Transactions

```typescript
import { getTransactions, getTransactionsByDateRange } from '@/lib/db/queries';

// Get all transactions
const allTransactions = await getTransactions();

// Get with filters
const expenses = await getTransactions({
  type: 'expense',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  limit: 20
});

// Get by date range
const monthly = await getTransactionsByDateRange(
  '2024-01-01',
  '2024-01-31'
);
```

### 4. Get Summary

```typescript
import { getSummaryByDateRange } from '@/lib/db/queries';

const summary = await getSummaryByDateRange(
  '2024-01-01',
  '2024-01-31'
);

// Result: [
//   { type: 'income', total: 5000, count: 1 },
//   { type: 'expense', total: 1200, count: 15 }
// ]
```

### 5. Manage Categories

```typescript
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '@/lib/db/queries';

// Get all expense categories
const expenses = await getCategories('expense');

// Create new category
const newCategory = await createCategory({
  name: 'Groceries',
  type: 'expense',
  icon: 'shopping-cart',
  color: '#FF6B6B'
});

// Update category
await updateCategory(newCategory.id, {
  color: '#FF8C8C'
});

// Delete category
await deleteCategory(newCategory.id);
```

### 6. Create Recurring Expenses

```typescript
import { createRecurringExpense } from '@/lib/db/queries';

const recurring = await createRecurringExpense({
  category_id: 2, // Utilities
  account_id: 1,
  amount: 100.00,
  frequency: 'monthly',
  start_date: '2024-01-01',
  notes: 'Electricity bill'
});
```

### 7. Create Budgets

```typescript
import { createBudget } from '@/lib/db/queries';

const budget = await createBudget({
  category_id: 5, // Food & Dining
  amount: 500.00,
  period: 'monthly',
  alert_threshold: 80
});
```

### 8. Check Budget Status

```typescript
import { getBudgetSpend, getBudgetsByPeriod } from '@/lib/db/queries';

// Get active monthly budgets
const monthlyBudgets = await getBudgetsByPeriod('monthly');

// Get spending for a category this month
const spend = await getBudgetSpend(
  5, // category_id
  '2024-01-01',
  '2024-01-31'
);

const spent = spend[0]?.total ?? 0;
const budgetAmount = monthlyBudgets[0].amount;
const percentUsed = (spent / budgetAmount) * 100;
```

## Schema Design Principles

### 1. **Normalization**
- Separate concerns into distinct tables
- Eliminate redundancy (type stored in categories, not transactions)
- References via foreign keys maintain referential integrity

### 2. **Scalability**
- Strategic indexes on frequently queried columns
- Date indexing for time-range queries (common in finance apps)
- Composite indexes for complex filter combinations

### 3. **Offline-First**
- All data stored locally in SQLite
- Timestamps (`created_at`, `updated_at`) for sync capability
- No external dependencies required

### 4. **Type Safety**
- TypeScript types auto-inferred from schema
- Drizzle ORM prevents SQL injection
- Compile-time column availability checks

### 5. **Audit Trail**
- All tables have `created_at` and `updated_at`
- Track data changes for debugging and sync

### 6. **Constraints**
- **NOT NULL**: Required fields enforced at database level
- **CHECK**: Business rules (positive amounts, valid frequencies)
- **FOREIGN KEY**: Referential integrity prevents orphaned records
- **UNIQUE**: Prevent duplicates (category names, account names)

## Performance Optimization

### Query Patterns

| Operation | Index Used | Performance |
|-----------|-----------|-------------|
| Monthly summary | `idx_transactions_date` | O(log n) |
| Account filter | `idx_transactions_account_id` | O(log n) |
| Category filter | `idx_transactions_category_id` | O(log n) |
| Income/Expense sum | `idx_transactions_date_type` | O(log n) |
| Recurring processing | `idx_recurring_active_dates` | O(log n) |

### Database Pragmas

```sql
-- Enabled in db-client.ts
PRAGMA foreign_keys = ON;        -- Enforce referential integrity
PRAGMA journal_mode = WAL;       -- Write-Ahead Logging for concurrency
```

## Migration System

Migrations are versioned and applied sequentially:

```typescript
// Database version is stored in PRAGMA user_version
// Each migration increments the version
// Migrations run only if current_version < target_version
```

### Adding a New Migration

1. Create new migration in `migrations.ts`:
```typescript
{
  version: 3,
  description: 'Add new_table',
  up: async (db) => {
    await db.execAsync(`CREATE TABLE ...`);
  }
}
```

2. Increment `DATABASE_VERSION` constant
3. Migrations run automatically on app start

## Testing & Development

### Clear Database
```typescript
import { clearDatabase } from '@/lib/db/migrations';

await clearDatabase(db); // Clears all data and reseeds
```

### Raw SQL Access
```typescript
import { getRawDb } from '@/lib/db/db-client';

const db = getRawDb();
const result = await db.execAsync('SELECT * FROM transactions');
```

## Best Practices

1. **Always use query helpers** instead of raw SQL
2. **Validate amounts** are positive before database operations
3. **Use transactions** for multi-table operations
4. **Index on foreign keys** automatically created
5. **Use ISO date format** (YYYY-MM-DD) for consistency
6. **Handle foreign key constraints** - can't delete categories with transactions

## Type Definitions

All tables have inferred TypeScript types:

```typescript
import {
  type Category,
  type NewCategory,
  type Transaction,
  type NewTransaction,
  type Account,
  type NewAccount,
  type RecurringExpense,
  type NewRecurringExpense,
  type Budget,
  type NewBudget
} from '@/lib/db/schema';
```

Use `New*` types for insert operations, regular types for select results.

## Common Queries

### Get Current Month Summary
```typescript
const today = new Date();
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

const summary = await getSummaryByDateRange(firstDay, lastDay);
```

### Get Transactions with Category Details
```typescript
import { getDb } from '@/lib/db/db-client';
import { transactions, categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const db = getDb();
const txns = await db
  .select()
  .from(transactions)
  .leftJoin(categories, eq(transactions.category_id, categories.id));
```

### Update Account Balance from Transactions
```typescript
const summary = await getSummaryByDateRange('2024-01-01', '2024-12-31', accountId);
const income = summary.find(s => s.type === 'income')?.total ?? 0;
const expenses = summary.find(s => s.type === 'expense')?.total ?? 0;
const balance = initialBalance + income - expenses;

await updateAccountBalance(accountId, balance);
```

## Troubleshooting

### Foreign Key Constraint Error
**Problem**: Cannot delete category with active transactions
**Solution**: Delete or reassign transactions first, or use cascade delete

### Transaction Not Appearing
**Problem**: Inserted transaction doesn't show in queries
**Solution**: Ensure date is in ISO format (YYYY-MM-DD)

### Database Locked Error
**Problem**: Multiple concurrent writes fail
**Solution**: WAL mode is enabled; ensure only one write at a time

---

**Version**: 2.0
**Last Updated**: 2024-01-15
**Drizzle ORM**: ^0.45.1
**SQLite**: expo-sqlite ^16.0.10
