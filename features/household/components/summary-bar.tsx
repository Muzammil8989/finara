import { ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { HouseholdSummary } from '@/features/household/hooks/use-household';
import { UserService } from '@/features/user/services/user-service';
import React from 'react';
import { View } from 'react-native';

interface SummaryBarProps {
    summary: HouseholdSummary;
    currencyCode: string;
}

export function SummaryBar({ summary, currencyCode }: SummaryBarProps) {
    const colors = useThemeColors();
    const remainingColor = summary.remaining >= 0 ? colors.success : colors.error;
    const isOver = summary.remaining < 0;

    return (
        <View className="bg-surface dark:bg-dark-surface border border-divider dark:border-dark-divider rounded-xl p-4 mb-4 overflow-hidden">
            <View className="flex-row items-center justify-between">
                {/* Income */}
                <View className="flex-1">
                    <ThemedText type="kicker" className="mb-1" numberOfLines={1}>
                        Income
                    </ThemedText>
                    <ThemedText
                        className="text-2xl font-semibold text-textPrimary dark:text-dark-textPrimary"
                        style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {UserService.formatCurrency(summary.income, currencyCode)}
                    </ThemedText>
                </View>

                <View className="w-px h-10 bg-divider dark:bg-dark-divider mx-4" />

                {/* Spent */}
                <View className="flex-1 items-center">
                    <ThemedText type="kicker" className="mb-1" numberOfLines={1}>
                        Spent
                    </ThemedText>
                    <ThemedText
                        className="text-2xl font-semibold"
                        style={{ color: summary.spent > 0 ? colors.error : colors.textPrimary, fontFamily: 'SpaceGrotesk_700Bold' }}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {UserService.formatCurrency(summary.spent, currencyCode)}
                    </ThemedText>
                </View>

                <View className="w-px h-10 bg-divider dark:bg-dark-divider mx-4" />

                {/* Remaining */}
                <View className="flex-1 items-end">
                    <ThemedText type="kicker" className="mb-1" numberOfLines={1}>
                        {isOver ? 'Over' : 'Left'}
                    </ThemedText>
                    <ThemedText
                        className="text-2xl font-semibold"
                        style={{ color: remainingColor, fontFamily: 'SpaceGrotesk_700Bold' }}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {UserService.formatCurrency(Math.abs(summary.remaining), currencyCode)}
                    </ThemedText>
                </View>
            </View>

            {/* Progress bar */}
            {summary.income > 0 && (
                <View className="mt-4">
                    <View className="h-2 bg-borderStrong dark:bg-dark-borderStrong rounded-full overflow-hidden mb-1">
                        <View
                            style={{
                                width: `${Math.min((summary.spent / summary.income) * 100, 100)}%`,
                                backgroundColor: remainingColor,
                            }}
                            className="h-full rounded-full"
                        />
                    </View>
                    <ThemedText className="text-[11px] font-semibold text-textMuted dark:text-dark-textMuted text-right">
                        {Math.round(Math.min((summary.spent / summary.income) * 100, 100))}% used
                    </ThemedText>
                </View>
            )}
        </View>
    );
}
