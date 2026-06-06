import { AppCard, ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { UserService } from '@/features/user/services/user-service';
import React from 'react';
import { View } from 'react-native';

interface KpiSummaryCardProps {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    currency: string;
}

export function KpiSummaryCard({ totalIncome, totalExpense, netBalance, currency }: KpiSummaryCardProps) {
    const colors = useThemeColors();
    const fmt = (n: number) => UserService.formatCurrency(n, currency);
    const spentPct = Math.min(100, totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0);

    return (
        <AppCard className="p-5 mb-5" circleSize={100} circleOffset={28}>
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-1">
                    <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-1" numberOfLines={1}>
                        Total Earned
                    </ThemedText>
                    <ThemedText className="text-xl font-bold" style={{ color: colors.success, fontFamily: 'SpaceGrotesk_700Bold' }} numberOfLines={1} adjustsFontSizeToFit>
                        {fmt(totalIncome)}
                    </ThemedText>
                </View>
                <View className="w-px h-10 bg-divider dark:bg-dark-divider mx-4" />
                <View className="flex-1 items-end">
                    <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-1" numberOfLines={1}>
                        Total Spent
                    </ThemedText>
                    <ThemedText className="text-xl font-bold" style={{ color: colors.error, fontFamily: 'SpaceGrotesk_700Bold' }} numberOfLines={1} adjustsFontSizeToFit>
                        {fmt(totalExpense)}
                    </ThemedText>
                </View>
            </View>
            <View className="h-2 bg-borderStrong dark:bg-dark-borderStrong rounded-full overflow-hidden mb-1.5">
                <View
                    style={{ width: `${spentPct}%`, backgroundColor: colors.error }}
                    className="h-full rounded-full"
                />
            </View>
            <View className="flex-row justify-between mt-1">
                <ThemedText className="text-[10px] font-bold text-textMuted dark:text-dark-textMuted">
                    Net:{' '}
                    <ThemedText className="font-bold" style={{ color: netBalance >= 0 ? colors.success : colors.error, fontFamily: 'SpaceGrotesk_600SemiBold' }}>
                        {fmt(netBalance)}
                    </ThemedText>
                </ThemedText>
                <ThemedText className="text-[10px] font-bold text-textMuted dark:text-dark-textMuted" style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }}>
                    {Math.round(spentPct)}% spent
                </ThemedText>
            </View>
        </AppCard>
    );
}
