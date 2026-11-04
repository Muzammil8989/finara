import { render } from '@testing-library/react-native';
import React from 'react';
import { DailySpendingCard } from '@/features/reports/components/daily-spending-card';

describe('Insights: DailySpendingCard', () => {
  it('renders with multiple days of spending without crashing', () => {
    const lineData = [
      { value: 10, dataPointText: '10' },
      { value: 25, dataPointText: '25' },
      { value: 5, dataPointText: '5' },
    ];
    expect(() => render(<DailySpendingCard lineData={lineData} />)).not.toThrow();
  });
});
