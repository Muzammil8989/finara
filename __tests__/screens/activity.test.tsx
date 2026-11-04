/**
 * Activity tab against a real DB. Also run once per timezone by
 * `npm run test:tz`, since the Today/Yesterday grouping is date-sensitive.
 */
jest.unmock('@/lib/db/db-client');
import TransactionsScreen from '@/app/(tabs)/transactions';
import * as q from '@/lib/db/queries';
import { toISODateString } from '@/lib/utils/date';
import { renderWithProviders, runInteractionsImmediately } from '@/tests/helpers/render-with-providers';
import { createTestDb, TestDb } from '@/tests/helpers/test-db';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

let db: TestDb;
let accountId: number;
let incomeCat: number;

beforeEach(async () => {
  db = await createTestDb();
  runInteractionsImmediately();
  accountId = (await q.getAccounts())[0].id;
  incomeCat = (await q.getCategories('income'))[0].id;
});
afterEach(() => {
  db.close();
  jest.restoreAllMocks();
});

const localDay = (offset: number) => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset);
};
const header = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

describe('Activity', () => {
  it('groups by local calendar day with Today / Yesterday headers', async () => {
    const today = localDay(0);
    const yesterday = localDay(-1);
    // The default filter is the current month, so only expect the older
    // row's header when it falls in this month.
    const older = localDay(-5);
    for (const d of [today, yesterday, older]) {
      await q.createTransaction({ amount: 10, type: 'income', category_id: incomeCat, account_id: accountId, date: toISODateString(d) } as any);
    }

    await renderWithProviders(<TransactionsScreen />);
    expect(await screen.findByText(`Today, ${header(today)}`)).toBeTruthy();
    expect(screen.getByText(`Yesterday, ${header(yesterday)}`)).toBeTruthy();
    if (older.getMonth() === today.getMonth()) {
      expect(screen.getByText(header(older))).toBeTruthy();
    }
  });

  it('deleting a household transfer also deletes only its paired household expense', async () => {
    const date = toISODateString(localDay(0));
    await q.createHouseholdTransfer({ amount: 25, accountId, accountName: 'Cash', incomeCategoryId: incomeCat, date });
    const other = await q.createHouseholdTransfer({ amount: 25, accountId, accountName: 'Cash', incomeCategoryId: incomeCat, date });
    // Make the second one distinguishable in the list.
    await q.updateTransaction(other.income.id, { amount: 26 });

    await renderWithProviders(<TransactionsScreen />);
    const rows = await screen.findAllByLabelText(/ income$/);
    fireEvent(rows[rows.length - 1], 'longPress'); // oldest = first transfer (ordered newest first)
    fireEvent.press(await screen.findByLabelText('Delete transaction'));
    // The action sheet animates out before the confirm sheet opens.
    const confirm = await screen.findByLabelText('Delete', {}, { timeout: 2000 });
    await act(async () => {
      fireEvent.press(confirm);
    });

    await waitFor(() => {
      const txs = db.raw.prepare('select id from transactions').all() as { id: number }[];
      expect(txs).toEqual([{ id: other.income.id }]);
    }, { timeout: 2000 });
    expect(db.raw.prepare('select id from household_expenses').all()).toEqual([{ id: other.expense.id }]);
  });
});
