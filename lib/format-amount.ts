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

export function formatWithCommas(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return '';
    return num.toLocaleString('en-US');
}
