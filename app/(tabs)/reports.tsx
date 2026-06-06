import { EmptyState, Skeleton, ThemedText } from '@/components/common';
import { useModals } from '@/context/modal-context';
import { useUser } from '@/features/user/context/user-context';
import { useTransactions } from '@/features/transactions/hooks/use-transactions';
import { useSavingsGoals } from '@/features/savings/hooks/use-savings-goals';
import {
    CategoryExpense,
    DailySpend,
    MonthlyTotals,
    getDailySpending,
    getExpenseByCategory,
    getMonthlyTotals,
} from '@/lib/db/queries';
import { logger } from '@/lib/logger';
import React, { useCallback, useEffect, useState } from 'react';
import { InteractionManager, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryDonutCard } from './_reports/category-donut-card';
import { DailySpendingCard } from './_reports/daily-spending-card';
import { KpiSummaryCard } from './_reports/kpi-summary-card';
import { MonthlyBarCard } from './_reports/monthly-bar-card';
import { ReportsHeader } from './_reports/reports-header';
import { SavingsGoalsCards } from './_reports/savings-goals-cards';
import { SavingsRateCard } from './_reports/savings-rate-card';
import { TopCategoriesCard } from './_reports/top-categories-card';
import { PeriodFilter, getDateRange, PERIOD_OPTIONS } from './_reports/utils';

const PRIMARY_COLOR = '#246BFD';

function ReportsSkeleton() {
    return (
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            {/* KPI section label + 3 stat boxes */}
            <Skeleton height={11} width="22%" borderRadius={6} style={{ marginBottom: 10 }} />
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                {[0, 1, 2].map(i => (
                    <View key={i} style={{ flex: 1 }}>
                        <Skeleton height={72} borderRadius={16} />
                    </View>
                ))}
            </View>

            {/* Savings rate label + card */}
            <Skeleton height={11} width="28%" borderRadius={6} style={{ marginBottom: 10 }} />
            <Skeleton height={90} borderRadius={16} style={{ marginBottom: 16 }} />

            {/* Monthly bar chart label + card */}
            <Skeleton height={11} width="50%" borderRadius={6} style={{ marginBottom: 10 }} />
            <Skeleton height={180} borderRadius={16} style={{ marginBottom: 16 }} />

            {/* Category donut label + card */}
            <Skeleton height={11} width="38%" borderRadius={6} style={{ marginBottom: 10 }} />
            <Skeleton height={220} borderRadius={16} style={{ marginBottom: 16 }} />

            {/* Top categories label + rows */}
            <Skeleton height={11} width="44%" borderRadius={6} style={{ marginBottom: 10 }} />
            {[0, 1, 2, 3].map(i => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Skeleton width={36} height={36} borderRadius={18} />
                    <View style={{ flex: 1, marginHorizontal: 12 }}>
                        <Skeleton height={13} borderRadius={6} style={{ marginBottom: 5 }} />
                        <Skeleton width="40%" height={11} borderRadius={6} />
                    </View>
                    <Skeleton width={52} height={13} borderRadius={6} />
                </View>
            ))}
        </View>
    );
}

export default function ReportsScreen() {
    const { profile } = useUser();
    const insets = useSafeAreaInsets();
    const { refreshSignal } = useModals();
    const { transactions, refresh } = useTransactions();
    const { goals, refresh: refreshGoals } = useSavingsGoals();

    const [period, setPeriod] = useState<PeriodFilter>('month');
    const [categoryData, setCategoryData] = useState<CategoryExpense[]>([]);
    const [monthlyData, setMonthlyData] = useState<MonthlyTotals[]>([]);
    const [dailyData, setDailyData] = useState<DailySpend[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const { start, end, months } = getDateRange(period);
            const [cats, monthly, daily] = await Promise.all([
                getExpenseByCategory(start, end),
                getMonthlyTotals(months),
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

    // refresh() and refreshGoals() are already deferred inside their hooks.
    // Only loadData() (the reports-specific aggregation) needs scheduling here.
    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => loadData());
        return () => task.cancel();
    }, [refreshSignal, loadData]);

    const { start: rangeStart, end: rangeEnd } = getDateRange(period);
    const periodTransactions = transactions.filter(t => t.date != null && t.date >= rangeStart && t.date <= rangeEnd);
    const totalIncome  = periodTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = periodTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const netBalance   = totalIncome - totalExpense;
    const savingsRate  = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

    const lineData = dailyData.map(d => ({ value: d.amount, dataPointText: '' }));
    const noData   = categoryData.length === 0 && monthlyData.length === 0;

    const showSkeleton = loading && categoryData.length === 0 && monthlyData.length === 0;
    const refreshing = loading && (categoryData.length > 0 || monthlyData.length > 0);

    const handleRefresh = useCallback(async () => {
        await Promise.all([refresh(), refreshGoals(), loadData()]);
    }, [refresh, refreshGoals, loadData]);

    return (
        <View className="flex-1 bg-background dark:bg-dark-background">
            <ScrollView
                contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={PRIMARY_COLOR}
                        colors={[PRIMARY_COLOR]}
                    />
                }
            >
                <ReportsHeader insets={insets} period={period} onPeriodChange={setPeriod} />

                {showSkeleton ? (
                    <ReportsSkeleton />
                ) : noData ? (
                    <EmptyState
                        icon="bar-chart-outline"
                        title="No Data Yet"
                        subtitle="Add transactions to see your financial insights here."
                    />
                ) : (
                    <View className="px-4 mt-2">

                        <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-3">
                            Summary
                        </ThemedText>
                        <KpiSummaryCard
                            totalIncome={totalIncome}
                            totalExpense={totalExpense}
                            netBalance={netBalance}
                            currency={profile.currency}
                        />

                        <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-3">
                            Savings Rate
                        </ThemedText>
                        <SavingsRateCard
                            savingsRate={savingsRate}
                            netBalance={netBalance}
                            totalExpense={totalExpense}
                            totalIncome={totalIncome}
                            currency={profile.currency}
                        />

                        {monthlyData.length > 0 && (
                            <>
                                <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-3">
                                    Income vs Expense · {PERIOD_OPTIONS.find(p => p.key === period)?.label}
                                </ThemedText>
                                <MonthlyBarCard monthlyData={monthlyData} period={period} />
                            </>
                        )}

                        {categoryData.length > 0 && (
                            <>
                                <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-3">
                                    Spending by Category
                                </ThemedText>
                                <CategoryDonutCard categoryData={categoryData} currency={profile.currency} />
                            </>
                        )}

                        {categoryData.length > 0 && (
                            <>
                                <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-3">
                                    Top Spending Categories
                                </ThemedText>
                                <TopCategoriesCard categoryData={categoryData} currency={profile.currency} />
                            </>
                        )}

                        {period === 'month' && lineData.length > 1 && (
                            <>
                                <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-3">
                                    Daily Spending · This Month
                                </ThemedText>
                                <DailySpendingCard lineData={lineData} />
                            </>
                        )}

                        {goals.length > 0 && (
                            <>
                                <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-3">
                                    Savings Goals
                                </ThemedText>
                                <SavingsGoalsCards goals={goals} currency={profile.currency} />
                            </>
                        )}

                    </View>
                )}
            </ScrollView>
        </View>
    );
}
