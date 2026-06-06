import {
    toISODateString,
    todayString,
    formatDateDisplay,
    formatDateShort,
    isToday,
    isCurrentMonth,
    getPeriodDateRange,
    getRelativeTime,
    getStartOfDay,
    getEndOfDay,
    getStartOfMonth,
    getEndOfMonth,
} from '@/lib/utils/date';

describe('toISODateString', () => {
    it('formats a date to YYYY-MM-DD', () => {
        expect(toISODateString(new Date(2026, 4, 17))).toBe('2026-05-17');
    });

    it('pads single-digit month and day with zeros', () => {
        expect(toISODateString(new Date(2026, 0, 5))).toBe('2026-01-05');
    });

    it('handles December (month 11)', () => {
        expect(toISODateString(new Date(2025, 11, 31))).toBe('2025-12-31');
    });
});

describe('todayString', () => {
    it('returns a string in YYYY-MM-DD format', () => {
        expect(todayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns today\'s date', () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        expect(todayString()).toBe(`${y}-${m}-${d}`);
    });
});

describe('formatDateDisplay', () => {
    it('formats May correctly', () => {
        expect(formatDateDisplay('2026-05-17')).toBe('May 17, 2026');
    });

    it('formats January correctly', () => {
        expect(formatDateDisplay('2026-01-01')).toBe('Jan 1, 2026');
    });

    it('formats December correctly', () => {
        expect(formatDateDisplay('2025-12-31')).toBe('Dec 31, 2025');
    });

    it('handles all 12 months', () => {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        months.forEach((m, i) => {
            const month = String(i + 1).padStart(2, '0');
            expect(formatDateDisplay(`2025-${month}-15`)).toContain(m);
        });
    });
});

describe('formatDateShort', () => {
    it('returns month and day without year', () => {
        const result = formatDateShort('2026-05-17');
        expect(result).toContain('May');
        expect(result).toContain('17');
        expect(result).not.toContain('2026');
    });
});

describe('isToday', () => {
    it('returns true for today', () => {
        const today = new Date().toISOString().split('T')[0];
        expect(isToday(today)).toBe(true);
    });

    it('returns false for yesterday', () => {
        const d = new Date(Date.now() - 86_400_000);
        expect(isToday(d.toISOString().split('T')[0])).toBe(false);
    });

    it('returns false for tomorrow', () => {
        const d = new Date(Date.now() + 86_400_000);
        expect(isToday(d.toISOString().split('T')[0])).toBe(false);
    });
});

describe('isCurrentMonth', () => {
    it('returns true for a date in the current month', () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        expect(isCurrentMonth(`${y}-${m}-01`)).toBe(true);
    });

    it('returns false for last month', () => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        expect(isCurrentMonth(`${y}-${m}-15`)).toBe(false);
    });

    it('returns false for next year', () => {
        expect(isCurrentMonth(`${new Date().getFullYear() + 1}-01-01`)).toBe(false);
    });
});

describe('getPeriodDateRange', () => {
    it('daily: start equals end and equals today', () => {
        const { startDate, endDate } = getPeriodDateRange('daily');
        expect(startDate).toBe(endDate);
        expect(startDate).toBe(todayString());
    });

    it('weekly: end >= start and both match YYYY-MM-DD', () => {
        const { startDate, endDate } = getPeriodDateRange('weekly');
        expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(new Date(endDate) >= new Date(startDate)).toBe(true);
    });

    it('weekly: spans exactly 6 days', () => {
        const { startDate, endDate } = getPeriodDateRange('weekly');
        const diff = (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000;
        expect(diff).toBe(6);
    });

    it('monthly: start is day 1 of current month', () => {
        const { startDate } = getPeriodDateRange('monthly');
        expect(startDate.endsWith('-01')).toBe(true);
        const now = new Date();
        expect(startDate.startsWith(`${now.getFullYear()}`)).toBe(true);
    });

    it('monthly: end is last day of current month', () => {
        const { endDate } = getPeriodDateRange('monthly');
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        expect(endDate.endsWith(`-${String(lastDay).padStart(2, '0')}`)).toBe(true);
    });

    it('yearly: start is Jan 1', () => {
        const year = new Date().getFullYear();
        expect(getPeriodDateRange('yearly').startDate).toBe(`${year}-01-01`);
    });

    it('yearly: end is Dec 31', () => {
        const year = new Date().getFullYear();
        expect(getPeriodDateRange('yearly').endDate).toBe(`${year}-12-31`);
    });
});

describe('getRelativeTime', () => {
    it('returns "Just now" for a very recent timestamp', () => {
        expect(getRelativeTime(new Date().toISOString())).toBe('Just now');
    });

    it('returns "1 minute ago" for 1 minute past', () => {
        const t = new Date(Date.now() - 61_000).toISOString();
        expect(getRelativeTime(t)).toBe('1 minute ago');
    });

    it('returns "X minutes ago" for multiple minutes', () => {
        const t = new Date(Date.now() - 5 * 60_000).toISOString();
        expect(getRelativeTime(t)).toBe('5 minutes ago');
    });

    it('returns "1 hour ago" for ~1 hour past', () => {
        const t = new Date(Date.now() - 3_700_000).toISOString();
        expect(getRelativeTime(t)).toBe('1 hour ago');
    });

    it('returns "X hours ago" for multiple hours', () => {
        const t = new Date(Date.now() - 3 * 3_600_000).toISOString();
        expect(getRelativeTime(t)).toBe('3 hours ago');
    });

    it('returns "1 day ago" for ~1 day past', () => {
        const t = new Date(Date.now() - 25 * 3_600_000).toISOString();
        expect(getRelativeTime(t)).toBe('1 day ago');
    });

    it('returns "X days ago" for multiple days', () => {
        const t = new Date(Date.now() - 3 * 86_400_000).toISOString();
        expect(getRelativeTime(t)).toBe('3 days ago');
    });
});

describe('getStartOfDay / getEndOfDay', () => {
    it('getStartOfDay sets time to 00:00:00', () => {
        const d = getStartOfDay(new Date(2026, 4, 17, 15, 30));
        expect(d.getHours()).toBe(0);
        expect(d.getMinutes()).toBe(0);
        expect(d.getSeconds()).toBe(0);
    });

    it('getEndOfDay sets time to 23:59:59', () => {
        const d = getEndOfDay(new Date(2026, 4, 17, 8, 0));
        expect(d.getHours()).toBe(23);
        expect(d.getMinutes()).toBe(59);
        expect(d.getSeconds()).toBe(59);
    });

    it('getStartOfDay preserves the date', () => {
        const d = getStartOfDay(new Date(2026, 4, 17));
        expect(d.getFullYear()).toBe(2026);
        expect(d.getMonth()).toBe(4);
        expect(d.getDate()).toBe(17);
    });
});

describe('getStartOfMonth / getEndOfMonth', () => {
    it('getStartOfMonth returns day 1', () => {
        const d = getStartOfMonth(new Date(2026, 4, 15));
        expect(d.getDate()).toBe(1);
        expect(d.getMonth()).toBe(4);
    });

    it('getEndOfMonth returns last day of May (31)', () => {
        const d = getEndOfMonth(new Date(2026, 4, 15));
        expect(d.getDate()).toBe(31);
    });

    it('getEndOfMonth handles February in non-leap year (28 days)', () => {
        const d = getEndOfMonth(new Date(2025, 1, 1));
        expect(d.getDate()).toBe(28);
    });

    it('getEndOfMonth handles February in leap year (29 days)', () => {
        const d = getEndOfMonth(new Date(2024, 1, 1));
        expect(d.getDate()).toBe(29);
    });

    it('getEndOfMonth handles April (30 days)', () => {
        const d = getEndOfMonth(new Date(2026, 3, 1));
        expect(d.getDate()).toBe(30);
    });
});
