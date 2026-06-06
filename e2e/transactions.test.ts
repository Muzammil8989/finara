import { device, element, by, expect as detoxExpect } from 'detox';

describe('Transactions', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('opens add transaction modal from FAB', async () => {
    await element(by.id('fab-add-button')).tap();
    await detoxExpect(element(by.text('Add Transaction'))).toBeVisible();
  });

  it('adds an expense transaction', async () => {
    await element(by.id('fab-add-button')).tap();
    await element(by.id('amount-input')).typeText('500');
    await element(by.text('Expense')).tap();
    await element(by.text('Save')).tap();
    await detoxExpect(element(by.text('500'))).toBeVisible();
  });

  it('navigates to Activity tab', async () => {
    await element(by.text('Activity')).tap();
    await detoxExpect(element(by.text('Transactions'))).toBeVisible();
  });
});
