/**
 * Currency Utility Functions
 * Centralized currency formatting and conversion functions
 */

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number as compact currency (e.g., $1.2K, $1.5M)
 */
export function formatCurrencyCompact(
  amount: number,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string {
  if (amount >= 1000000) {
    return formatCurrency(amount / 1000000, currencyCode, locale).replace(/\.0+/, '') + 'M';
  }
  if (amount >= 1000) {
    return formatCurrency(amount / 1000, currencyCode, locale).replace(/\.0+/, '') + 'K';
  }
  return formatCurrency(amount, currencyCode, locale);
}

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyString: string): number {
  const cleaned = currencyString.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Get currency symbol from currency code
 */
export function getCurrencySymbol(currencyCode: string, locale: string = 'en-US'): string {
  return (0).toLocaleString(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).replace(/\d/g, '').trim();
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Round to 2 decimal places
 */
export function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Format large numbers with commas
 */
export function formatNumber(value: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(value);
}
