import { Rule, ScreenHeader, SegmentedControl, ThemedText, type SegmentOption } from '@/components/common';
import { UserService } from '@/features/user/services/user-service';
import { useThemeColors } from '@/hooks/use-theme-colors';
import React from 'react';
import { View } from 'react-native';
import { PeriodFilter, getProgressColor } from '../utils';

interface BudgetHeaderProps {
    insets: { top: number };
    periodFilter: PeriodFilter;
    onPeriodChange: (p: PeriodFilter) => void;
    totalSpent: number;
    totalBudgeted: number;
    overallPercent: number;
    /** Totals mix periods and were converted to monthly amounts. */
    isMonthlyEquivalent?: boolean;
    currency: string;
    showSummary: boolean;
    /** Number of budgets in view, shown in the kicker. */
    count?: number;
}

const PERIOD_OPTIONS: readonly SegmentOption<PeriodFilter>[] = [
    { key: 'all', label: 'All' },
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
];

export function BudgetHeader({
    insets,
    periodFilter,
    onPeriodChange,
    totalSpent,
    totalBudgeted,
    overallPercent,
    isMonthlyEquivalent = false,
    currency,
    showSummary,
    count,
}: BudgetHeaderProps) {
    const colors = useThemeColors();
    const overallColor = getProgressColor(overallPercent, colors);
    const isOver = totalSpent > totalBudgeted;
    const diff = Math.abs(totalBudgeted - totalSpent);

    return (
        <View className="bg-background dark:bg-dark-background" style={{ paddingTop: insets.top }}>
            <ScreenHeader
                showBack={false}
                kicker={count != null ? `${count} active ${count === 1 ? 'limit' : 'limits'}` : 'Spending limits'}
                title="Budgets"
            />

            <SegmentedControl
                options={PERIOD_OPTIONS}
                value={periodFilter}
                onChange={onPeriodChange}
                className="mx-5"
            />

            {showSummary && (
                <View className="px-5 pt-5 pb-4">
                    <View className="flex-row">
                        <View className="flex-1">
                            <ThemedText type="kicker" className="mb-1" numberOfLines={1}>
                                {isMonthlyEquivalent ? 'Spent / month' : 'Total Spent'}
                            </ThemedText>
                            <ThemedText type="figure" className="text-[26px] leading-8" numberOfLines={1} adjustsFontSizeToFit>
                                {UserService.formatCurrency(totalSpent, currency)}
                            </ThemedText>
                        </View>
                        <View className="w-px bg-divider dark:bg-dark-divider mx-4" />
                        <View className="flex-1 items-end">
                            <ThemedText type="kicker" className="mb-1" numberOfLines={1}>
                                {isMonthlyEquivalent ? 'Budget / month' : 'Total Budget'}
                            </ThemedText>
                            <ThemedText type="figure" className="text-[26px] leading-8" numberOfLines={1} adjustsFontSizeToFit>
                                {UserService.formatCurrency(totalBudgeted, currency)}
                            </ThemedText>
                        </View>
                    </View>

                    {/* Progress rule */}
                    <View
                        className="h-1 rounded-full overflow-hidden mt-4 mb-2 bg-backgroundAlt dark:bg-dark-surfaceAlt"
                        accessible
                        accessibilityRole="progressbar"
                        accessibilityValue={{ min: 0, max: 100, now: Math.min(Math.round(overallPercent), 100) }}
                    >
                        <View
                            style={{ width: `${Math.min(overallPercent, 100)}%`, backgroundColor: overallColor }}
                            className="h-full rounded-full"
                        />
                    </View>

                    <View className="flex-row justify-between items-center">
                        <ThemedText type="caption">
                            {Math.round(overallPercent)}% of total budget used
                        </ThemedText>
                        {diff !== 0 && (
                            <ThemedText type="figure" className="text-xs" style={{ color: isOver ? colors.expense : colors.textSecondary }}>
                                {isOver
                                    ? `${UserService.formatCurrency(diff, currency)} over`
                                    : `${UserService.formatCurrency(diff, currency)} left`}
                            </ThemedText>
                        )}
                    </View>
                    <Rule className="mt-4 -mb-4" />
                </View>
            )}
        </View>
    );
}
