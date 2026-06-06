import { AppCard, ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { MonthlyTotals } from '@/lib/db/queries';
import React from 'react';
import { View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { CHART_WIDTH, PERIOD_OPTIONS, PeriodFilter } from './utils';

interface MonthlyBarCardProps {
    monthlyData: MonthlyTotals[];
    period: PeriodFilter;
}

export function MonthlyBarCard({ monthlyData, period }: MonthlyBarCardProps) {
    const colors = useThemeColors();
    const periodLabel = PERIOD_OPTIONS.find(p => p.key === period)?.label ?? '';

    // Tight gap (3px) within a month pair, wide gap (20px) between months
    const barData = monthlyData.flatMap((m, i) => [
        {
            value: m.income,
            label: m.month,
            frontColor: colors.success,
            topLabelComponent: () => null,
            spacing: 3,
            labelWidth: 44,
        },
        {
            value: m.expense,
            frontColor: colors.error,
            topLabelComponent: () => null,
            spacing: i < monthlyData.length - 1 ? 20 : 4,
        },
    ]);

    if (barData.length === 0) return null;

    const maxVal = Math.max(...monthlyData.map(m => Math.max(m.income, m.expense, 1))) * 1.25;

    return (
        <AppCard className="p-5 mb-5" circleSize={100} circleOffset={28}>

            {/* Header */}
            <View className="flex-row items-center justify-between mb-1">
                <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted">
                    Income vs Expenses
                </ThemedText>
                <ThemedText className="text-[10px] font-bold text-textMuted dark:text-dark-textMuted">
                    {periodLabel}
                </ThemedText>
            </View>
            <View className="flex-row items-center gap-4 mb-4">
                <View className="flex-row items-center gap-1.5">
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success }} />
                    <ThemedText className="text-xs font-semibold text-textMuted dark:text-dark-textMuted">Income</ThemedText>
                </View>
                <View className="flex-row items-center gap-1.5">
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.error }} />
                    <ThemedText className="text-xs font-semibold text-textMuted dark:text-dark-textMuted">Expense</ThemedText>
                </View>
            </View>

            <BarChart
                data={barData}
                barWidth={18}
                spacing={20}
                initialSpacing={8}
                roundedTop
                hideRules
                hideAxesAndRules
                xAxisThickness={0}
                yAxisThickness={0}
                noOfSections={4}
                maxValue={maxVal}
                height={160}
                width={CHART_WIDTH - 40}
                barBorderRadius={5}
                labelWidth={44}
                xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10, fontWeight: '700' }}
                isAnimated
            />
        </AppCard>
    );
}
