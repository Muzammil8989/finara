import { toLocalDateStr } from '@/components/common';
import tokens from '@/theme/tokens';

export type SavingsFilter = 'all' | 'active' | 'completed';

export const SAVINGS_FILTER_OPTIONS: { value: SavingsFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
];

export const GOAL_COLORS: string[] = tokens.swatches;

export const GOAL_ICONS = [
    'home', 'car', 'airplane', 'school', 'medical', 'gift', 'phone-portrait',
    'laptop', 'tv', 'camera', 'watch', 'diamond', 'leaf', 'trophy',
    'heart', 'wallet', 'cash', 'card', 'briefcase', 'bicycle',
];

export function defaultDeadline(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toLocalDateStr(d);
}

export function formatDeadlineDisplay(s: string): string {
    const [y, m, d] = s.split('-').map(Number);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[m - 1]} ${d}, ${y}`;
}

const DAYS_PER_MONTH = 365.25 / 12;

/**
 * Amount to save each month to cover `remaining` in `daysLeft` days.
 * Less than a month away counts as one month (the whole remainder now).
 */
export function monthlyPaceNeeded(remaining: number, daysLeft: number): number | null {
    if (remaining <= 0 || daysLeft <= 0) return null;
    const months = Math.max(1, daysLeft / DAYS_PER_MONTH);
    return Math.ceil((remaining / months) * 100) / 100;
}
