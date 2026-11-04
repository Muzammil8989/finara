import { UserService } from '@/features/user/services/user-service';

describe('UserService.formatCurrency', () => {
  it('keeps the minus sign for negative amounts', () => {
    expect(UserService.formatCurrency(-500, 'USD')).toBe('-$500.00');
  });

  it('formats positive amounts and zero without a sign', () => {
    expect(UserService.formatCurrency(1234.5, 'USD')).toBe('$1,234.50');
    expect(UserService.formatCurrency(0, 'USD')).toBe('$0.00');
  });

  it('uses the currency symbol', () => {
    expect(UserService.formatCurrency(-3, 'EUR')).toBe('-€3.00');
  });
});
