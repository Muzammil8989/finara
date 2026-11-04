import { checkSpendable } from '@/features/transactions/utils';

describe('checkSpendable', () => {
  it('compares in cents, so float sums still cover the exact amount', () => {
    expect(checkSpendable({ balance: 0.3 + 0.6, type: 'cash' }, 0.9)).toEqual({ ok: true });
  });
  it('blocks spending more than the chosen account holds', () => {
    expect(checkSpendable({ balance: 0, type: 'cash' }, 500)).toEqual({ ok: false, available: 0 });
    expect(checkSpendable({ balance: 120, type: 'checking' }, 120.01)).toEqual({ ok: false, available: 120 });
  });
  it('never blocks a credit card, which is meant to go below zero', () => {
    expect(checkSpendable({ balance: -500, type: 'credit' }, 200)).toEqual({ ok: true });
  });
  it('reports zero available rather than a negative number', () => {
    expect(checkSpendable({ balance: -20, type: 'savings' }, 5)).toEqual({ ok: false, available: 0 });
  });
});
