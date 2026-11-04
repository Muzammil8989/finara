/**
 * Date handling must give the same calendar answers in every timezone.
 * The original bugs only showed up west of UTC (date strings parsed as UTC
 * midnight -> previous local day) or around DST changes.
 *
 * Jest can't switch timezones inside a run, so `npm run test:tz`
 * (scripts/test-timezones.js) runs this file once per zone with TZ set.
 */
import {
    addMonthsClamped,
    diffCalendarDays,
    formatDateShort,
    getPeriodDateRange,
    isToday,
    parseLocalDate,
    startOfWeek,
    toISODateString,
    todayString,
} from '@/lib/utils/date';

const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

describe(`dates in ${zone}`, () => {
    afterEach(() => jest.useRealTimers());

    it('runs in the timezone requested by test:tz', () => {
        if (process.env.EXPECT_TZ) expect(zone).toBe(process.env.EXPECT_TZ);
    });

    it('parseLocalDate keeps the calendar day', () => {
        const d = parseLocalDate('2026-03-10');
        expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 2, 10]);
        expect(toISODateString(d)).toBe('2026-03-10');
    });

    it('formatDateShort shows the stored day, not the day before', () => {
        expect(formatDateShort('2026-03-10')).toBe('Mar 10');
    });

    it('todayString uses the local date late in the evening', () => {
        jest.useFakeTimers().setSystemTime(new Date(2026, 5, 15, 23, 30));
        expect(todayString()).toBe('2026-06-15');
        expect(isToday('2026-06-15')).toBe(true);
    });

    it('diffCalendarDays counts calendar days across DST changes', () => {
        // US DST starts 2026-03-08, NZ DST ends 2026-04-05.
        expect(diffCalendarDays(parseLocalDate('2026-03-07'), parseLocalDate('2026-03-09'))).toBe(2);
        expect(diffCalendarDays(parseLocalDate('2026-04-04'), parseLocalDate('2026-04-06'))).toBe(2);
        expect(diffCalendarDays(new Date(2026, 2, 7, 23, 59), new Date(2026, 2, 8, 0, 1))).toBe(1);
        expect(diffCalendarDays(parseLocalDate('2026-03-10'), parseLocalDate('2026-03-01'))).toBe(-9);
    });

    it('weeks start on Monday', () => {
        expect(toISODateString(startOfWeek(parseLocalDate('2026-03-11')))).toBe('2026-03-09'); // Wed
        expect(toISODateString(startOfWeek(parseLocalDate('2026-03-15')))).toBe('2026-03-09'); // Sun
        expect(toISODateString(startOfWeek(parseLocalDate('2026-03-09')))).toBe('2026-03-09'); // Mon
    });

    it('weekly budget period is Monday to Sunday', () => {
        jest.useFakeTimers().setSystemTime(new Date(2026, 2, 15, 12)); // Sunday
        expect(getPeriodDateRange('weekly')).toEqual({ startDate: '2026-03-09', endDate: '2026-03-15' });
    });

    it('addMonthsClamped clamps to month end', () => {
        expect(toISODateString(addMonthsClamped(parseLocalDate('2026-01-31'), 1))).toBe('2026-02-28');
        expect(toISODateString(addMonthsClamped(parseLocalDate('2024-01-31'), 1))).toBe('2024-02-29');
        expect(toISODateString(addMonthsClamped(parseLocalDate('2026-12-15'), 2))).toBe('2027-02-15');
    });
});
