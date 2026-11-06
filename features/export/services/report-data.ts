import { loadBudgetsWithSpend } from '@/features/budgets/services/budget-spend';
import { getExpenseByCategory, getMonthlyTotals, getPeriodTotals, getTransactions, isTransferCategory, type MonthlyTotals } from '@/lib/db/queries';
import { parseLocalDate, toISODateString } from '@/lib/utils/date';

export interface ReportTransaction {
    date: string;
    type: 'income' | 'expense';
    category: string;
    account: string;
    amount: number;
    notes: string;
    /** Lending/borrowing/repayment: moves money but is not income or spending. */
    isTransfer: boolean;
}

export interface ReportCategory {
    name: string;
    total: number;
    /** Share of total spending, 0–100, one decimal. */
    percent: number;
}

export interface ReportBudget {
    category: string;
    period: string;
    limit: number;
    spent: number;
    remaining: number;
    percentUsed: number;
}

export interface ReportData {
    title: string;
    /** "This month", "Last 3 months", … */
    periodLabel: string;
    start: string;
    end: string;
    /** ISO timestamp the report was built. */
    generatedAt: string;
    currency: string;
    ownerName: string;
    summary: {
        income: number;
        expense: number;
        net: number;
        /** null when there was no income to save from. */
        savingsRate: number | null;
        transactionCount: number;
    };
    monthly: MonthlyTotals[];
    categories: ReportCategory[];
    transactions: ReportTransaction[];
    /** Current-period budget standing (budgets are live, not historical). */
    budgets: ReportBudget[];
}

export interface ReportSections {
    transactions: boolean;
    categories: boolean;
    budgets: boolean;
}

export const ALL_SECTIONS: ReportSections = { transactions: true, categories: true, budgets: true };

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Months between two YYYY-MM-DD dates, inclusive of both ends' months. */
function monthSpan(start: string, end: string): number {
    const [sy, sm] = start.split('-').map(Number);
    const [ey, em] = end.split('-').map(Number);
    return (ey - sy) * 12 + (em - sm) + 1;
}

/**
 * Collect everything a PDF or Excel report needs for [start, end].
 * Pure data — no formatting — so both exporters (and tests) share it.
 */
export async function buildReportData(opts: {
    start: string;
    end: string;
    periodLabel: string;
    currency: string;
    ownerName?: string;
    sections?: ReportSections;
    now?: Date;
}): Promise<ReportData> {
    const { start, end, periodLabel, currency, ownerName = '', sections = ALL_SECTIONS, now = new Date() } = opts;

    // Monthly totals run up to the anchor month — the range end, or today if the
    // range reaches into the future — and back to the month `start` is in.
    const endDate = parseLocalDate(end);
    const anchor = endDate < now ? endDate : now;
    const months = Math.max(1, monthSpan(start, toISODateString(anchor)));
    // Totals come from SQL; the rows themselves are only loaded when the
    // transactions section is included.
    const [totals, rows, byCategory, monthly, budgets] = await Promise.all([
        getPeriodTotals(start, end),
        sections.transactions ? getTransactions({ startDate: start, endDate: end }) : Promise.resolve([]),
        getExpenseByCategory(start, end),
        getMonthlyTotals(months, anchor),
        sections.budgets ? loadBudgetsWithSpend() : Promise.resolve([]),
    ]);

    const income = round2(totals.income);
    const expense = round2(totals.expense);
    const transactions: ReportTransaction[] = rows.map(r => {
        const isTransfer = isTransferCategory(r.category?.name);
        return {
            date: r.date,
            type: r.type as 'income' | 'expense',
            category: r.category?.name ?? 'Uncategorised',
            account: r.account?.name ?? '',
            amount: r.amount,
            notes: r.notes ?? '',
            isTransfer,
        };
    });

    const totalSpend = byCategory.reduce((s, c) => s + c.total, 0);
    const categories: ReportCategory[] = byCategory.map(c => ({
        name: c.categoryName,
        total: round2(c.total),
        percent: totalSpend > 0 ? Math.round((c.total / totalSpend) * 1000) / 10 : 0,
    }));

    return {
        title: 'Financial report',
        periodLabel,
        start,
        end,
        generatedAt: now.toISOString(),
        currency,
        ownerName,
        summary: {
            income,
            expense,
            net: round2(income - expense),
            savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : null,
            transactionCount: totals.count,
        },
        monthly,
        categories: sections.categories ? categories : [],
        transactions,
        budgets: budgets.map(b => ({
            category: b.categoryName ?? 'All categories',
            period: b.period,
            limit: round2(b.amount),
            spent: round2(b.spent),
            remaining: round2(b.remaining),
            percentUsed: Math.round(b.percentUsed),
        })),
    };
}

/** Safe file name stem, e.g. "Folio-report-2026-11-01-to-2026-11-30". */
export function reportFileStem(data: Pick<ReportData, 'start' | 'end'>): string {
    return `Folio-report-${data.start}-to-${data.end}`;
}
