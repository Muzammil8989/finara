/**
 * Insights — a short written report for the chosen period:
 *
 *   header       date range, title, Export (PDF / Excel)
 *   standfirst   one plain-English paragraph summarising the period
 *   key figures  income, spending, net, savings rate
 *   cash flow    income vs spending by month (at least 6 months for context)
 *   categories   sorted horizontal bars with amount + share
 *   daily        this month's spending per day with the average marked
 */

import {
    EmptyState,
    HeaderIconButton,
    PeriodSelector,
    Rule,
    ScreenHeader,
    Section,
    Skeleton,
    StatFigure,
    ThemedText,
} from '@/components/common';
import { CashflowBars } from '@/features/reports/components/cashflow-bars';
import { CategoryBars } from '@/features/reports/components/category-bars';
import { DailySpendingCard } from '@/features/reports/components/daily-spending-card';
import { PeriodFilter, buildDonutSlices, buildStandfirst, getDateRange, useChartWidth } from '@/features/reports/utils';
import { useTransactions } from '@/features/transactions/hooks/use-transactions';
import { useUser } from '@/features/user/context/user-context';
import { UserService } from '@/features/user/services/user-service';
import { useThemeColors } from '@/hooks/use-theme-colors';
import {
    CategoryExpense,
    DailySpend,
    MonthlyTotals,
    getDailySpending,
    getExpenseByCategory,
    getMonthlyTotals,
    isTransferCategory,
} from '@/lib/db/queries';
import { logger } from '@/lib/logger';
import { parseLocalDate, toISODateString } from '@/lib/utils/date';
import { useModals } from '@/providers/modal-context';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { InteractionManager, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatRange(start: string, end: string): string {
    const s = parseLocalDate(start);
    const e = parseLocalDate(end);
    const sameYear = s.getFullYear() === e.getFullYear();
    const sFmt = s.toLocaleDateString(undefined, { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
    const eFmt = e.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    return `${sFmt} – ${eFmt}`;
}

function ReportsSkeleton() {
    return (
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <Skeleton height={14} borderRadius={4} style={{ marginBottom: 8 }} />
            <Skeleton width="80%" height={14} borderRadius={4} style={{ marginBottom: 28 }} />
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                <Skeleton height={52} borderRadius={6} style={{ flex: 1 }} />
                <Skeleton height={52} borderRadius={6} style={{ flex: 1 }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
                <Skeleton height={52} borderRadius={6} style={{ flex: 1 }} />
                <Skeleton height={52} borderRadius={6} style={{ flex: 1 }} />
            </View>
            <Skeleton height={180} borderRadius={6} style={{ marginBottom: 32 }} />
            {[0, 1, 2, 3].map(i => (
                <View key={i} style={{ marginBottom: 16 }}>
                    <Skeleton width="60%" height={12} borderRadius={4} style={{ marginBottom: 6 }} />
                    <Skeleton height={8} borderRadius={2} />
                </View>
            ))}
        </View>
    );
}

export default function ReportsScreen() {
    const { profile } = useUser();
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const chartWidth = useChartWidth() - 8;
    const { refreshSignal, openModal } = useModals();
    const { transactions, refresh } = useTransactions();
    const currency = profile.currency;
    const fmt = useCallback((n: number) => UserService.formatCurrency(n, currency), [currency]);

    const [period, setPeriod] = useState<PeriodFilter>('month');
    const [categoryData, setCategoryData] = useState<CategoryExpense[]>([]);
    const [monthlyData, setMonthlyData] = useState<MonthlyTotals[]>([]);
    const [dailyData, setDailyData] = useState<DailySpend[]>([]);
    const [loading, setLoading] = useState(true);

    // Figures and charts run to today: scheduled (future-dated) entries are
    // left out everywhere, so totals, categories and the daily chart agree.
    const today = toISODateString(new Date());
    const fullRange = getDateRange(period);
    const range = { ...fullRange, end: fullRange.end < today ? fullRange.end : today };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const { start, end: periodEnd, months } = getDateRange(period);
            const todayStr = toISODateString(new Date());
            const end = periodEnd < todayStr ? periodEnd : todayStr;
            const [cats, monthly, daily] = await Promise.all([
                getExpenseByCategory(start, end),
                // "This year" charts January → this month, matching the key figures.
                // Shorter periods have little trend to show, so they chart 6 months.
                getMonthlyTotals(period === 'year' ? new Date().getMonth() + 1 : Math.max(months, 6)),
                period === 'month' ? getDailySpending(start, end) : Promise.resolve([]),
            ]);
            setCategoryData(cats);
            setMonthlyData(monthly);
            setDailyData(daily);
        } catch (e) {
            logger.error('Failed to load reports data', e);
        } finally {
            setLoading(false);
        }
    }, [period]);

    // refresh() is already deferred inside its hook; only loadData() needs scheduling here.
    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => loadData());
        return () => task.cancel();
    }, [refreshSignal, loadData]);

    const figures = useMemo(() => {
        let income = 0, expense = 0;
        for (const t of transactions) {
            if (t.date == null || t.date < range.start || t.date > range.end) continue;
            if (isTransferCategory(t.category)) continue; // lending/borrowing isn't income or spending
            if (t.type === 'income') income += t.amount; else expense += t.amount;
        }
        const net = income - expense;
        const savingsRate = income > 0 ? Math.round((net / income) * 100) : null;
        return { income, expense, net, savingsRate };
    }, [transactions, range.start, range.end]);

    const standfirst = useMemo(() => {
        const top = buildDonutSlices(categoryData, 6).slices.find(s => s.key !== 'other');
        return buildStandfirst({
            period,
            income: figures.income,
            expense: figures.expense,
            topCategory: top ? { name: top.label, percent: top.percent } : null,
            format: fmt,
        });
    }, [categoryData, period, figures, fmt]);

    const lineData = dailyData.map(d => ({ value: d.amount, dataPointText: '' }));
    // Months are zero-filled, so "no data" means every month is empty.
    const noData = categoryData.length === 0 && monthlyData.every(m => m.income === 0 && m.expense === 0);
    const showSkeleton = loading && categoryData.length === 0 && monthlyData.length === 0;
    const refreshing = loading && (categoryData.length > 0 || monthlyData.length > 0);

    const handleRefresh = useCallback(async () => {
        await Promise.all([refresh(), loadData()]);
    }, [refresh, loadData]);

    return (
        <View className="flex-1 bg-background dark:bg-dark-background">
            <ScrollView
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                <View className="bg-background dark:bg-dark-background" style={{ paddingTop: insets.top }}>
                    <ScreenHeader
                        showBack={false}
                        kicker={formatRange(range.start, range.end)}
                        title="Insights"
                        right={
                            <HeaderIconButton
                                icon="share-outline"
                                accessibilityLabel="Export report as PDF or Excel"
                                onPress={() => openModal('export')}
                            />
                        }
                    />
                    <PeriodSelector value={period} onChange={setPeriod} className="mx-5" />
                </View>

                {showSkeleton ? (
                    <ReportsSkeleton />
                ) : noData ? (
                    <EmptyState
                        icon="bar-chart-outline"
                        title="No data yet"
                        subtitle="Add a few transactions and this page will turn them into a report."
                    />
                ) : (
                    <>
                        {/* ── Standfirst ───────────────────────────────── */}
                        <View className="px-5 pt-5">
                            <ThemedText className="text-[17px] leading-[26px]" style={{ color: colors.textSecondary }}>
                                {standfirst}
                            </ThemedText>
                        </View>

                        {/* ── Key figures ──────────────────────────────── */}
                        <View className="px-5 mt-6">
                            <Rule strong className="mb-4" />
                            <View className="flex-row mb-5">
                                <View className="flex-1">
                                    <StatFigure label="Income" value={fmt(figures.income)} valueColor={colors.income} />
                                </View>
                                <View className="flex-1">
                                    <StatFigure label="Spending" value={fmt(figures.expense)} />
                                </View>
                            </View>
                            <View className="flex-row">
                                <View className="flex-1">
                                    <StatFigure
                                        label="Net"
                                        value={`${figures.net < 0 ? '−' : '+'}${fmt(Math.abs(figures.net))}`}
                                        valueColor={figures.net < 0 ? colors.expense : colors.textPrimary}
                                    />
                                </View>
                                <View className="flex-1">
                                    <StatFigure
                                        label="Savings rate"
                                        value={figures.savingsRate == null ? '—' : `${figures.savingsRate}%`}
                                        valueColor={figures.savingsRate != null && figures.savingsRate < 0 ? colors.expense : undefined}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* ── Cash flow ────────────────────────────────── */}
                        {monthlyData.some(m => m.income > 0 || m.expense > 0) && (
                            <Section kicker={period === 'year' ? `${new Date().getFullYear()} so far` : `Last ${monthlyData.length} months`} title="Income vs spending">
                                <CashflowBars data={monthlyData} currency={currency} width={chartWidth} />
                            </Section>
                        )}

                        {/* ── Categories ───────────────────────────────── */}
                        {categoryData.length > 0 && (
                            <Section kicker="Where it went" title="Spending by category">
                                <CategoryBars categoryData={categoryData} currency={currency} />
                            </Section>
                        )}

                        {/* ── Daily ────────────────────────────────────── */}
                        {period === 'month' && lineData.length > 1 && (
                            <Section kicker="This month" title="Daily spending">
                                <DailySpendingCard lineData={lineData} formatValue={fmt} />
                            </Section>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}
