/** Pure helpers behind the redesigned Budgets, Savings and Insights screens. */
import { getBudgetStatus } from '@/features/budgets/utils';
import { compactMoney, niceMax } from '@/features/reports/chart-theme';
import { buildStandfirst } from '@/features/reports/utils';
import { monthlyPaceNeeded } from '@/features/savings/utils';

const fmt = (n: number) => `$${n.toFixed(2)}`;

describe('getBudgetStatus', () => {
  it('is on track below the alert threshold', () => {
    expect(getBudgetStatus(79, 80).tone).toBe('ok');
  });
  it('is near once the threshold is reached, up to and including 100%', () => {
    expect(getBudgetStatus(80, 80).tone).toBe('near');
    expect(getBudgetStatus(100, 80).tone).toBe('near');
  });
  it('is over only past the limit', () => {
    expect(getBudgetStatus(100.01, 80).tone).toBe('over');
  });
  it('respects a custom threshold', () => {
    expect(getBudgetStatus(55, 50).tone).toBe('near');
  });
});

describe('monthlyPaceNeeded', () => {
  it('spreads the remainder over the months left', () => {
    // ~91 days ≈ 3 months
    expect(monthlyPaceNeeded(300, 91)).toBeCloseTo(100.33, 1);
  });
  it('asks for the whole remainder when under a month is left', () => {
    expect(monthlyPaceNeeded(250, 10)).toBe(250);
  });
  it('returns null when nothing is left or the deadline passed', () => {
    expect(monthlyPaceNeeded(0, 30)).toBeNull();
    expect(monthlyPaceNeeded(100, 0)).toBeNull();
  });
});

describe('buildStandfirst', () => {
  it('reports how much less was spent than earned, and the top category', () => {
    expect(buildStandfirst({
      period: 'month', income: 1000, expense: 700, format: fmt,
      topCategory: { name: 'Groceries', percent: 28 },
    })).toBe('You spent $700.00 this month — 30% less than came in. Groceries took the largest share at 28%.');
  });
  it('reports overspending as an amount', () => {
    expect(buildStandfirst({ period: 'year', income: 100, expense: 150, format: fmt }))
      .toBe('You spent $150.00 this year — $50.00 more than came in.');
  });
  it('handles spending with no income', () => {
    expect(buildStandfirst({ period: '3months', income: 0, expense: 40, format: fmt }))
      .toBe('You spent $40.00 over the last 3 months, with no income recorded.');
  });
  it('handles an empty period', () => {
    expect(buildStandfirst({ period: 'month', income: 0, expense: 0, format: fmt }))
      .toBe('Nothing recorded this month yet.');
  });
});

describe('chart axis helpers', () => {
  it('rounds the axis max up to a nice number', () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(87)).toBe(100);
    expect(niceMax(1300)).toBe(2000);
    expect(niceMax(2100)).toBe(2500);
  });
  it('formats compact money labels', () => {
    expect(compactMoney(950)).toBe('$950');
    expect(compactMoney(1250)).toBe('$1.3k');
    expect(compactMoney(25000)).toBe('$25k');
    expect(compactMoney(-1500, '€')).toBe('−€1.5k');
  });
});
