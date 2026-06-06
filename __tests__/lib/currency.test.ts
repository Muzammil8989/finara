import {
    numberToWords,
    formatWithCommas,
    formatCurrency,
    formatCurrencyCompact,
    parseCurrency,
    getCurrencySymbol,
    formatPercentage,
    calculatePercentage,
    roundToTwo,
    formatNumber,
} from '@/lib/utils/currency';

describe('numberToWords', () => {
    it('returns "Zero" for 0', () => {
        expect(numberToWords(0)).toBe('Zero');
    });

    it('converts single digits', () => {
        expect(numberToWords(1)).toBe('One');
        expect(numberToWords(9)).toBe('Nine');
    });

    it('converts teens', () => {
        expect(numberToWords(11)).toBe('Eleven');
        expect(numberToWords(19)).toBe('Nineteen');
    });

    it('converts tens', () => {
        expect(numberToWords(20)).toBe('Twenty');
        expect(numberToWords(25)).toBe('Twenty Five');
    });

    it('converts hundreds', () => {
        expect(numberToWords(100)).toBe('One Hundred');
        expect(numberToWords(305)).toBe('Three Hundred Five');
    });

    it('converts thousands', () => {
        expect(numberToWords(1000)).toBe('One Thousand');
        expect(numberToWords(1234)).toBe('One Thousand Two Hundred Thirty Four');
    });

    it('converts millions', () => {
        expect(numberToWords(1_000_000)).toBe('One Million');
        expect(numberToWords(2_500_000)).toBe('Two Million Five Hundred Thousand');
    });

    it('converts billions', () => {
        expect(numberToWords(1_000_000_000)).toBe('One Billion');
    });

    it('ignores negative sign (uses absolute value)', () => {
        expect(numberToWords(-5)).toBe('Five');
    });

    it('ignores decimal part', () => {
        expect(numberToWords(3.99)).toBe('Three');
    });
});

describe('formatWithCommas', () => {
    it('formats a number string with commas', () => {
        expect(formatWithCommas('1234.56')).toBe('1,234.56');
    });

    it('returns empty string for zero', () => {
        expect(formatWithCommas('0')).toBe('');
    });

    it('returns empty string for negative', () => {
        expect(formatWithCommas('-5')).toBe('');
    });

    it('returns empty string for non-numeric string', () => {
        expect(formatWithCommas('abc')).toBe('');
    });

    it('formats large numbers', () => {
        expect(formatWithCommas('1000000')).toBe('1,000,000');
    });
});

describe('formatCurrency', () => {
    it('formats USD correctly', () => {
        expect(formatCurrency(1234.5)).toBe('$1,234.50');
    });

    it('formats zero', () => {
        expect(formatCurrency(0)).toBe('$0.00');
    });

    it('formats with a different currency code', () => {
        const result = formatCurrency(1000, 'EUR', 'de-DE');
        expect(result).toContain('1');
        expect(result).toContain('000');
    });

    it('always shows 2 decimal places', () => {
        expect(formatCurrency(5)).toBe('$5.00');
    });
});

describe('formatCurrencyCompact', () => {
    it('formats amounts under 1K as full currency', () => {
        expect(formatCurrencyCompact(999)).toBe('$999.00');
    });

    it('formats thousands with K suffix', () => {
        const result = formatCurrencyCompact(1500);
        expect(result).toContain('K');
        expect(result).toContain('1.5');
    });

    it('formats whole thousands without trailing .00', () => {
        const result = formatCurrencyCompact(2000);
        expect(result).toContain('K');
        expect(result).not.toContain('.00');
    });

    it('formats millions with M suffix', () => {
        const result = formatCurrencyCompact(1_500_000);
        expect(result).toContain('M');
        expect(result).toContain('1.5');
    });

    it('formats whole millions without trailing .00', () => {
        const result = formatCurrencyCompact(3_000_000);
        expect(result).toContain('M');
        expect(result).not.toContain('.00');
    });
});

describe('parseCurrency', () => {
    it('parses a currency string to a number', () => {
        expect(parseCurrency('$1,234.56')).toBeCloseTo(1234.56);
    });

    it('parses a plain number string', () => {
        expect(parseCurrency('42')).toBe(42);
    });

    it('returns 0 for empty string', () => {
        expect(parseCurrency('')).toBe(0);
    });

    it('strips all non-numeric characters except . and -', () => {
        expect(parseCurrency('€ 1.000,00')).toBeCloseTo(1.0);
    });
});

describe('getCurrencySymbol', () => {
    it('returns $ for USD', () => {
        expect(getCurrencySymbol('USD')).toBe('$');
    });

    it('returns a non-empty string for EUR', () => {
        const sym = getCurrencySymbol('EUR', 'en-US');
        expect(sym.length).toBeGreaterThan(0);
    });
});

describe('formatPercentage', () => {
    it('formats with 1 decimal by default', () => {
        expect(formatPercentage(75)).toBe('75.0%');
    });

    it('respects custom decimal places', () => {
        expect(formatPercentage(33.333, 2)).toBe('33.33%');
    });

    it('formats 0', () => {
        expect(formatPercentage(0)).toBe('0.0%');
    });

    it('formats 100', () => {
        expect(formatPercentage(100)).toBe('100.0%');
    });
});

describe('calculatePercentage', () => {
    it('calculates percentage correctly', () => {
        expect(calculatePercentage(50, 200)).toBe(25);
    });

    it('returns 0 when total is 0', () => {
        expect(calculatePercentage(10, 0)).toBe(0);
    });

    it('returns 100 when value equals total', () => {
        expect(calculatePercentage(5, 5)).toBe(100);
    });

    it('handles decimal values', () => {
        expect(calculatePercentage(1, 3)).toBeCloseTo(33.333);
    });
});

describe('roundToTwo', () => {
    it('rounds to 2 decimal places', () => {
        expect(roundToTwo(1.005)).toBeCloseTo(1.01, 1);
    });

    it('does not change a number already at 2 decimals', () => {
        expect(roundToTwo(1.25)).toBe(1.25);
    });

    it('rounds down correctly', () => {
        expect(roundToTwo(1.234)).toBe(1.23);
    });

    it('rounds up correctly', () => {
        expect(roundToTwo(1.235)).toBeCloseTo(1.24, 2);
    });

    it('handles 0', () => {
        expect(roundToTwo(0)).toBe(0);
    });
});

describe('formatNumber', () => {
    it('formats with thousands separator', () => {
        expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('formats 0', () => {
        expect(formatNumber(0)).toBe('0');
    });

    it('formats small numbers without separator', () => {
        expect(formatNumber(999)).toBe('999');
    });
});
