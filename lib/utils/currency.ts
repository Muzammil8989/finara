/**
 * Currency & Amount Utility Functions
 * Single source of truth for all currency formatting and number helpers.
 */

// ── Number-to-words helpers ──────────────────────────────────────────────────

const ONES = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function chunk(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
    return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + chunk(n % 100) : '');
}

/** Convert a number to English words (e.g., 1234 → "One Thousand Two Hundred Thirty Four") */
export function numberToWords(n: number): string {
    const int = Math.floor(Math.abs(n));
    if (int === 0) return 'Zero';
    if (int >= 1_000_000_000) {
        const b = Math.floor(int / 1_000_000_000);
        const rem = int % 1_000_000_000;
        return chunk(b) + ' Billion' + (rem ? ' ' + numberToWords(rem) : '');
    }
    if (int >= 1_000_000) {
        const m = Math.floor(int / 1_000_000);
        const rem = int % 1_000_000;
        return chunk(m) + ' Million' + (rem ? ' ' + numberToWords(rem) : '');
    }
    if (int >= 1_000) {
        const k = Math.floor(int / 1_000);
        const rem = int % 1_000;
        return chunk(k) + ' Thousand' + (rem ? ' ' + numberToWords(rem) : '');
    }
    return chunk(int);
}

/** Format a raw number string with locale commas (e.g., "1234.56" → "1,234.56") */
export function formatWithCommas(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return '';
    return num.toLocaleString('en-US');
}

// ── Intl-based formatters ────────────────────────────────────────────────────

/** Format a number as a full currency string (e.g., 1234.5 → "$1,234.50") */
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

/** Format a number as compact currency (e.g., 1500000 → "$1.5M") */
export function formatCurrencyCompact(
    amount: number,
    currencyCode: string = 'USD',
    locale: string = 'en-US'
): string {
    if (amount >= 1_000_000) return formatCurrency(amount / 1_000_000, currencyCode, locale).replace(/\.0+/, '') + 'M';
    if (amount >= 1_000) return formatCurrency(amount / 1_000, currencyCode, locale).replace(/\.0+/, '') + 'K';
    return formatCurrency(amount, currencyCode, locale);
}

/** Parse a currency string back to a number */
export function parseCurrency(currencyString: string): number {
    return parseFloat(currencyString.replace(/[^0-9.-]/g, '')) || 0;
}

/** Get the currency symbol from a currency code (e.g., "USD" → "$") */
export function getCurrencySymbol(currencyCode: string, locale: string = 'en-US'): string {
    return (0).toLocaleString(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).replace(/\d/g, '').trim();
}

/** Format a value as a percentage string (e.g., 0.75 → "75.0%") */
export function formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
}

/** Calculate what percentage `value` is of `total` */
export function calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return (value / total) * 100;
}

/** Round a number to 2 decimal places */
export function roundToTwo(value: number): number {
    return Math.round(value * 100) / 100;
}

/** Format a large number with locale thousands separators */
export function formatNumber(value: number, locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale).format(value);
}
