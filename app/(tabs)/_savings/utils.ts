import { toLocalDateStr } from '@/components/common';

export type SavingsFilter = 'all' | 'active' | 'completed';

export const SAVINGS_FILTER_OPTIONS: { value: SavingsFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
];

export const GOAL_COLORS = [
    '#246BFD', '#10B981', '#EF4444', '#F59E0B',
    '#8B5CF6', '#06B6D4', '#EC4899', '#F97316',
];

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
