import type { AppColorTheme } from '@/theme/colors';

export type TimeFilter = 'Month' | 'Day' | 'Week' | 'Custom';

// Identical in light + dark — module-level constants, no hook
const SUCCESS_COLOR = '#10B981';
const ERROR_COLOR = '#EF4444';

// Hoisted so it can be used both for pre-computed constants and custom category colors
const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
};

// Pre-computed dark-mode bg values — no inline magic strings
const SUCCESS_DARK_BG = hexToRgba(SUCCESS_COLOR, 0.15);
const ERROR_DARK_BG = hexToRgba(ERROR_COLOR, 0.15);

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
            const dow = now.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
            const daysFromMonday = (dow + 6) % 7; // Sun→6, Mon→0, Tue→1, ...
            const monday = new Date(now);
            monday.setDate(now.getDate() - daysFromMonday);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
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

// success/error removed — those are now constants above; only theme-dependent bg values needed
type CategoryStyleColors = Pick<AppColorTheme, 'successBg' | 'errorBg'>;

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
            bgColor: isDark ? SUCCESS_DARK_BG : colors.successBg,
            iconColor: SUCCESS_COLOR,
        };
    }
    return {
        icon: 'receipt',
        bgColor: isDark ? ERROR_DARK_BG : colors.errorBg,
        iconColor: ERROR_COLOR,
    };
}
