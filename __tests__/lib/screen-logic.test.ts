/** Pure helpers behind the Budgets header and the Insights donut. */
import { summarizeBudgets } from '@/features/budgets/utils';
import { buildDonutSlices } from '@/features/reports/utils';

describe('summarizeBudgets', () => {
  it('sums budgets of a single period as-is', () => {
    const s = summarizeBudgets([
      { amount: 500, spent: 200, period: 'monthly' },
      { amount: 300, spent: 100, period: 'monthly' },
    ]);
    expect(s).toEqual({ totalBudgeted: 800, totalSpent: 300, overallPercent: 37.5, isMonthlyEquivalent: false });
  });

  it('converts mixed periods to monthly equivalents instead of adding unlike amounts', () => {
    const s = summarizeBudgets([
      { amount: 1200, spent: 600, period: 'yearly' }, // 100 / 50 per month
      { amount: 400, spent: 100, period: 'monthly' },
    ]);
    expect(s.isMonthlyEquivalent).toBe(true);
    expect(s.totalBudgeted).toBeCloseTo(500);
    expect(s.totalSpent).toBeCloseTo(150);
  });

  it('reports over-budget percentages above 100', () => {
    expect(summarizeBudgets([{ amount: 100, spent: 130, period: 'weekly' }]).overallPercent).toBe(130);
  });

  it('handles no budgets', () => {
    expect(summarizeBudgets([]).overallPercent).toBe(0);
  });
});

describe('buildDonutSlices', () => {
  const cat = (id: number, total: number) => ({ categoryId: id, categoryName: `C${id}`, categoryColor: null, total });

  it('uses the same slices for chart and legend, grouping the rest as Other', () => {
    const { slices, total } = buildDonutSlices([cat(1, 50), cat(2, 40), cat(3, 30), cat(4, 20), cat(5, 10), cat(6, 5), cat(7, 5)]);
    expect(slices.map(s => s.label)).toEqual(['C1', 'C2', 'C3', 'C4', 'Other']);
    expect(slices[4].value).toBe(20);
    expect(total).toBe(160);
    expect(slices.reduce((s, x) => s + x.value, 0)).toBe(total);
  });

  it('does not add Other when everything fits', () => {
    const { slices } = buildDonutSlices([cat(1, 75), cat(2, 25)]);
    expect(slices.map(s => [s.label, s.percent])).toEqual([['C1', 75], ['C2', 25]]);
  });
});
