jest.unmock('@/lib/db/db-client');
jest.mock('@/features/notifications/services/notification-service', () => ({
  NotificationService: { checkAndSendBudgetAlert: jest.fn().mockResolvedValue(undefined) },
}));

import { AddTransactionModal } from '@/features/transactions/components/add-transaction-modal';
import { NotificationService } from '@/features/notifications/services/notification-service';
import * as q from '@/lib/db/queries';
import { toast } from '@/lib/toast';
import { todayString } from '@/lib/utils/date';
import { renderWithProviders, runInteractionsImmediately } from '@/tests/helpers/render-with-providers';
import { createTestDb, TestDb } from '@/tests/helpers/test-db';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

let db: TestDb;
beforeEach(async () => {
  db = await createTestDb();
  runInteractionsImmediately();
  jest.clearAllMocks();
});
afterEach(() => {
  db.close();
  jest.restoreAllMocks();
});

const rows = () =>
  db.raw.prepare('select amount, type, date from transactions order by id').all() as { amount: number; type: string; date: string }[];

async function fillAndSave(amount: string, categoryName: string) {
  fireEvent.changeText(await screen.findByPlaceholderText('0.00'), amount);
  fireEvent.press(screen.getByText(categoryName));
  await act(async () => {
    fireEvent.press(screen.getByText('Save Transaction'));
  });
}

describe('Add transaction modal', () => {
  it('lets you spend from an opening balance without adding income first', async () => {
    const accounts = await q.getAccounts();
    await q.updateAccount(accounts[0].id, { balance: 1000 });
    const expenseCat = (await q.getCategories('expense'))[0];

    await renderWithProviders(<AddTransactionModal visible onClose={jest.fn()} onSuccess={jest.fn()} />);
    await fillAndSave('200', expenseCat.name);

    await waitFor(() => expect(rows()).toEqual([{ amount: 200, type: 'expense', date: todayString() }]));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('accepts a decimal comma amount', async () => {
    const incomeCat = (await q.getCategories('income'))[0];
    await renderWithProviders(<AddTransactionModal visible initialType="income" onClose={jest.fn()} onSuccess={jest.fn()} />);
    await fillAndSave('12,5', incomeCat.name);
    await waitFor(() => expect(rows()[0]?.amount).toBe(12.5));
  });

  it('checks budget alerts after saving an expense', async () => {
    const accounts = await q.getAccounts();
    await q.updateAccount(accounts[0].id, { balance: 100 });
    const expenseCat = (await q.getCategories('expense'))[0];
    await renderWithProviders(<AddTransactionModal visible onClose={jest.fn()} onSuccess={jest.fn()} />);
    await fillAndSave('30', expenseCat.name);
    await waitFor(() =>
      expect(NotificationService.checkAndSendBudgetAlert).toHaveBeenCalledWith(expenseCat.id, 30, expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/))
    );
  });

  it('blocks an expense larger than the available balance', async () => {
    const expenseCat = (await q.getCategories('expense'))[0];
    await renderWithProviders(<AddTransactionModal visible onClose={jest.fn()} onSuccess={jest.fn()} />);
    await fillAndSave('50', expenseCat.name);
    expect(toast.error).toHaveBeenCalled();
    expect(rows()).toEqual([]);
  });

  it('explains what is missing instead of loading forever when there are no payment methods', async () => {
    db.raw.exec('DELETE FROM accounts');
    jest.spyOn(q, 'ensureDefaultAccount').mockResolvedValue(undefined);
    const onClose = jest.fn();
    await renderWithProviders(<AddTransactionModal visible onClose={onClose} onSuccess={jest.fn()} />);
    expect(await screen.findByText('No payment method yet')).toBeTruthy();
    fireEvent.press(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
