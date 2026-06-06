/**
 * Test helpers for database operations.
 * Use an in-memory SQLite instance for integration tests.
 */

export function createMockTransaction(overrides: Record<string, unknown> = {}) {
    return {
        id: 1,
        category_id: 1,
        account_id: 1,
        amount: 100,
        type: 'expense',
        date: '2026-01-01',
        notes: null,
        ...overrides,
    };
}

export function createMockBudget(overrides: Record<string, unknown> = {}) {
    return {
        id: 1,
        category_id: 1,
        amount: 500,
        period: 'monthly',
        is_active: 1,
        alert_threshold: 80,
        ...overrides,
    };
}
