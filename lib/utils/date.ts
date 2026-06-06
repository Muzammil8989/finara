/**
 * Date Utility Functions
 * Single source of truth for all date formatting and manipulation.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** Format a Date object to YYYY-MM-DD string (no timezone shift) */
export function toISODateString(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Alias kept for compatibility */
export const getISODateString = toISODateString;

/** Get today's date as YYYY-MM-DD */
export function todayString(): string {
    return toISODateString(new Date());
}

/** Format a YYYY-MM-DD string to human-readable "Jan 1, 2025" */
export function formatDateDisplay(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[m - 1]} ${d}, ${y}`;
}

/** Format a date string to a readable locale-aware format (e.g., "Jan 1, 2025") */
export function formatDate(dateString: string, locale: string = 'en-US'): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Format a date to a short format (e.g., "Jan 1") */
export function formatDateShort(dateString: string, locale: string = 'en-US'): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

/** Format a date to show time (e.g., "3:45 PM") */
export function formatTime(dateString: string, locale: string = 'en-US'): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

/** Format a date to show both date and time */
export function formatDateTime(dateString: string, locale: string = 'en-US'): string {
    const date = new Date(dateString);
    return date.toLocaleString(locale, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
    });
}

/** Get relative time description (e.g., "2 days ago", "in 3 hours") */
export function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
    if (diffInHours > 0) return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    if (diffInMinutes > 0) return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
    return 'Just now';
}

/** Get start of day */
export function getStartOfDay(date: Date = new Date()): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

/** Get end of day */
export function getEndOfDay(date: Date = new Date()): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

/** Get start of month */
export function getStartOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Get end of month */
export function getEndOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/** Check if a date string is today */
export function isToday(dateString: string): boolean {
    return new Date(dateString).toDateString() === new Date().toDateString();
}

/** Check if a date string is in the current month */
export function isCurrentMonth(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

/** Get date range for a given budget/recurring period relative to now */
export function getPeriodDateRange(period: string): { startDate: string; endDate: string } {
    const now = new Date();

    if (period === 'daily') {
        const today = toISODateString(now);
        return { startDate: today, endDate: today };
    } else if (period === 'weekly') {
        const day = now.getDay();
        const start = new Date(now);
        start.setDate(now.getDate() - day);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { startDate: toISODateString(start), endDate: toISODateString(end) };
    } else if (period === 'monthly') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { startDate: toISODateString(start), endDate: toISODateString(end) };
    } else {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31);
        return { startDate: toISODateString(start), endDate: toISODateString(end) };
    }
}
