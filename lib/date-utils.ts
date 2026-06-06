const pad = (n: number) => String(n).padStart(2, '0');

/** Format a Date to YYYY-MM-DD string */
export function toISODateString(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

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

/** Get date range for a given period relative to now */
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
        // yearly
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31);
        return { startDate: toISODateString(start), endDate: toISODateString(end) };
    }
}
