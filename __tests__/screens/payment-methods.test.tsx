jest.unmock('@/lib/db/db-client');
import PaymentMethodsScreen from '@/app/payment-methods';
import * as q from '@/lib/db/queries';
import { createTestDb, TestDb } from '@/tests/helpers/test-db';
import { renderWithProviders, runInteractionsImmediately } from '@/tests/helpers/render-with-providers';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

let db: TestDb;
beforeEach(async () => {
  db = await createTestDb();
  runInteractionsImmediately();
});
afterEach(() => {
  db.close();
  jest.restoreAllMocks();
});

async function editAndSave(accountName: string) {
  fireEvent.press(await screen.findByLabelText(`Edit ${accountName}`));
  await act(async () => {
    fireEvent.press(screen.getByText('Update Payment Method'));
  });
}

describe('Payment Methods screen', () => {
  it('shows the computed balance but edits the opening balance, so saving twice changes nothing', async () => {
    const cash = (await q.getAccounts()).find(a => a.name === 'Cash')!;
    await q.updateAccount(cash.id, { balance: 100 });
    const [incomeCat] = await q.getCategories('income');
    await q.createTransaction({ amount: 50, type: 'income', category_id: incomeCat.id, account_id: cash.id, date: '2026-03-01' } as any);

    await renderWithProviders(<PaymentMethodsScreen />);
    expect(await screen.findByText('$150.00')).toBeTruthy();

    fireEvent.press(await screen.findByLabelText('Edit Cash'));
    expect(screen.getByDisplayValue('100')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByText('Update Payment Method'));
    });

    await editAndSave('Cash');

    await waitFor(async () => {
      const after = (await q.getAccountsWithBalance()).find(a => a.id === cash.id)!;
      expect(after.initial_balance).toBe(100);
      expect(after.balance).toBe(150);
    });
  });

  it('shows a negative balance with a minus sign', async () => {
    const cash = (await q.getAccounts()).find(a => a.name === 'Cash')!;
    const [expenseCat] = await q.getCategories('expense');
    await q.createTransaction({ amount: 20, type: 'expense', category_id: expenseCat.id, account_id: cash.id, date: '2026-03-01' } as any);

    await renderWithProviders(<PaymentMethodsScreen />);
    expect(await screen.findByText('-$20.00')).toBeTruthy();
  });
});
