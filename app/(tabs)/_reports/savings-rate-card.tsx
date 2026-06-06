import { AppCard, ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { UserService } from '@/features/user/services/user-service';
import React from 'react';
import { View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

interface SavingsRateCardProps {
    savingsRate: number;
    netBalance: number;
    totalExpense: number;
    totalIncome: number;
    currency: string;
}

export function SavingsRateCard({ savingsRate, netBalance, totalExpense, totalIncome, currency }: SavingsRateCardProps) {
    const colors = useThemeColors();
    const fmt = (n: number) => UserService.formatCurrency(n, currency);

    const ringData = [
        { value: Math.max(0, savingsRate),       color: colors.success },
        { value: Math.max(0, 100 - savingsRate), color: colors.borderStrong },
    ];
    const spentPct = Math.min(100, totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0);

    return (
        <AppCard className="p-5 mb-5" circleSize={100} circleOffset={28}>
            <View className="flex-row items-center gap-5">
                <View style={{ width: 110, height: 110, alignItems: 'center', justifyContent: 'center' }}>
                    <PieChart
                        data={ringData}
                        donut
                        radius={52}
                        innerRadius={36}
                        showText={false}
                        focusOnPress={false}
                    />
                    <View style={{ position: 'absolute', alignItems: 'center' }}>
                        <ThemedText className="text-xl font-bold" style={{ color: savingsRate >= 0 ? colors.success : colors.error, fontFamily: 'SpaceGrotesk_700Bold' }}>
                            {Math.max(0, savingsRate)}%
                        </ThemedText>
                    </View>
                </View>
                <View className="flex-1 gap-3">
                    <View>
                        <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-0.5">
                            Saved
                        </ThemedText>
                        <ThemedText className="text-base font-bold" style={{ color: colors.success, fontFamily: 'SpaceGrotesk_700Bold' }}>
                            {fmt(Math.max(0, netBalance))}
                        </ThemedText>
                    </View>
                    <View>
                        <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-0.5">
                            Spent
                        </ThemedText>
                        <ThemedText className="text-base font-bold" style={{ color: colors.error, fontFamily: 'SpaceGrotesk_700Bold' }}>
                            {fmt(totalExpense)}
                        </ThemedText>
                    </View>
                    <View style={{ height: 6, borderRadius: 99, overflow: 'hidden', backgroundColor: colors.borderStrong }}>
                        <View style={{
                            width: `${spentPct}%`,
                            height: '100%',
                            backgroundColor: colors.error,
                            borderRadius: 99,
                        }} />
                    </View>
                </View>
            </View>
        </AppCard>
    );
}
