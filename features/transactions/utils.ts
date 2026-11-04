import { HOUSEHOLD_TRANSFER_NOTE } from '@/lib/db/queries';
import { startOfWeek } from '@/lib/utils/date';
import type { AppColorTheme } from '@/theme/colors';

export type TimeFilter = 'Month' | 'Day' | 'Week' | 'Custom';

// Hoisted so it can be used both for pre-computed constants and custom category colors
const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
};

const localStr = (d: Date): string => {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
};

export function getDateRange(
    filter: TimeFilter | null,
    customStart?: Date,
    customEnd?: Date,
): { startDate: string; endDate: string } | null {
    if (filter === null) return null;
    const now = new Date();
    const today = localStr(now);

    switch (filter) {
        case 'Day':
            return { startDate: today, endDate: today };
        case 'Week': {
            // Current calendar week (Monday → Sunday) containing today.
            // Using the full week range — not "last 7 days up to today" — so
            // transactions dated later in the same week still appear.
            const monday = startOfWeek(now);
            const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
            return { startDate: localStr(monday), endDate: localStr(sunday) };
        }
        case 'Month': {
            // Current calendar month (1st → last day) containing today.
            const first = new Date(now.getFullYear(), now.getMonth(), 1);
            const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return { startDate: localStr(first), endDate: localStr(last) };
        }
        case 'Custom':
            if (customStart && customEnd) {
                return {
                    startDate: localStr(customStart),
                    endDate: localStr(customEnd),
                };
            }
            return null;
        default:
            return null;
    }
}

type CategoryStyleColors = Pick<AppColorTheme, 'successBg' | 'errorBg' | 'income' | 'textSecondary'>;

export function getCategoryStyle(
    categoryIcon: string | undefined,
    categoryColor: string | undefined,
    type: 'income' | 'expense',
    isDark: boolean,
    colors: CategoryStyleColors,
) {
    if (categoryIcon && categoryColor) {
        const lighten = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            const l = (c: number) => Math.min(255, c + (255 - c) * 0.7);
            return `rgb(${l(r)},${l(g)},${l(b)})`;
        };
        return {
            icon: categoryIcon,
            bgColor: isDark ? hexToRgba(categoryColor, 0.15) : lighten(categoryColor),
            iconColor: categoryColor,
        };
    }

    if (type === 'income') {
        return {
            icon: 'arrow-down',
            bgColor: colors.successBg,
            iconColor: colors.income,
        };
    }
    return {
        icon: 'receipt-outline',
        bgColor: colors.errorBg,
        iconColor: colors.textSecondary,
    };
}

const cents = (n: number) => Math.round(n * 100);

/**
 * Can an expense of `amount` be paid from this account?
 * - Compares in whole cents, so 0.30 + 0.60 covers a 0.90 expense.
 * - Uses the chosen account's own balance, not the total of all accounts,
 *   so cash can't go negative because the bank account has money.
 * - Credit cards are meant to go below zero, so they are never blocked.
 */
export function checkSpendable(
    account: { balance: number; type?: string | null } | undefined,
    amount: number,
): { ok: true } | { ok: false; available: number } {
    if (!account || account.type === 'credit') return { ok: true };
    if (cents(amount) <= cents(account.balance)) return { ok: true };
    return { ok: false, available: Math.max(0, account.balance) };
}

/**
 * Transactions created by Loans or the Household budget are bookkeeping for
 * those records; editing them directly would leave the loan or household
 * figures out of step with the balance. Returns where to change it instead.
 */
export function linkedSource(t: { category?: string | null; note?: string | null; type: string }): 'Loans' | 'Household' | 'Savings' | 'Transfers' | null {
    if (t.category === 'Loan Given' || t.category === 'Loan Received') return 'Loans';
    if (t.category === 'To Savings' || t.category === 'From Savings') return 'Savings';
    if (t.category === 'Transfer Out' || t.category === 'Transfer In') return 'Transfers';
    if (t.type === 'income' && t.note === HOUSEHOLD_TRANSFER_NOTE) return 'Household';
    return null;
}
