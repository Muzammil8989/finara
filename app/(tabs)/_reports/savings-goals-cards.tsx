import { AppCard, ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { UserService } from '@/features/user/services/user-service';
import { SavingsGoal } from '@/lib/db/schema';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { DEFAULT_COLORS } from './utils';

interface SavingsGoalsCardsProps {
    goals: SavingsGoal[];
    currency: string;
}

export function SavingsGoalsCards({ goals, currency }: SavingsGoalsCardsProps) {
    const colors = useThemeColors();
    const fmt = (n: number) => UserService.formatCurrency(n, currency);

    const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
    const totalSaved  = goals.reduce((s, g) => s + g.saved_amount, 0);
    const completed   = goals.filter(g => g.is_completed === 1).length;
    const overallPct  = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

    return (
        <>
            {/* Overview card */}
            <AppCard className="p-5 mb-3" circleSize={100} circleOffset={28}>
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1">
                        <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-1" numberOfLines={1}>
                            Total Saved
                        </ThemedText>
                        <ThemedText className="text-xl font-bold" style={{ color: colors.success, fontFamily: 'SpaceGrotesk_700Bold' }} numberOfLines={1} adjustsFontSizeToFit>
                            {fmt(totalSaved)}
                        </ThemedText>
                    </View>
                    <View className="w-px h-10 bg-divider dark:bg-dark-divider mx-4" />
                    <View className="flex-1 items-end">
                        <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-1" numberOfLines={1}>
                            Total Target
                        </ThemedText>
                        <ThemedText className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary" style={{ fontFamily: 'SpaceGrotesk_700Bold' }} numberOfLines={1} adjustsFontSizeToFit>
                            {fmt(totalTarget)}
                        </ThemedText>
                    </View>
                </View>
                <View className="h-2 bg-borderStrong dark:bg-dark-borderStrong rounded-full overflow-hidden mb-1.5">
                    <View style={{ width: `${overallPct}%`, backgroundColor: colors.success }} className="h-full rounded-full" />
                </View>
                <View className="flex-row justify-between">
                    <ThemedText className="text-[10px] font-bold text-textMuted dark:text-dark-textMuted">
                        {Math.round(overallPct)}% of total target saved
                    </ThemedText>
                    {completed > 0 && (
                        <View className="flex-row items-center gap-1">
                            <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                            <ThemedText className="text-[10px] font-bold" style={{ color: colors.success }}>
                                {completed} completed
                            </ThemedText>
                        </View>
                    )}
                </View>
            </AppCard>

            {/* Individual goals */}
            <AppCard className="p-5 mb-5" circleSize={100} circleOffset={28}>
                <View className="gap-4">
                    {goals.map((goal, i) => {
                        const pct = goal.target_amount > 0 ? Math.min((goal.saved_amount / goal.target_amount) * 100, 100) : 0;
                        const color = goal.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
                        const isCompleted = goal.is_completed === 1 || pct >= 100;
                        return (
                            <View key={goal.id}>
                                <View className="flex-row items-center justify-between mb-1.5">
                                    <View className="flex-row items-center gap-2">
                                        <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                                            <Ionicons name={(goal.icon || 'wallet') as IoniconsName} size={15} color={color} />
                                        </View>
                                        <ThemedText className="text-sm font-bold text-textPrimary dark:text-dark-textPrimary" numberOfLines={1}>
                                            {goal.name}
                                        </ThemedText>
                                    </View>
                                    {isCompleted
                                        ? <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                                        : <ThemedText className="text-sm font-bold" style={{ color: colors.textMuted, fontFamily: 'SpaceGrotesk_600SemiBold' }}>{Math.round(pct)}%</ThemedText>
                                    }
                                </View>
                                <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.borderStrong }}>
                                    <View style={{ width: `${pct}%`, height: '100%', backgroundColor: isCompleted ? colors.success : color, borderRadius: 99 }} />
                                </View>
                                <View className="flex-row justify-between mt-0.5">
                                    <ThemedText className="text-[10px] font-bold text-textMuted dark:text-dark-textMuted" style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }}>
                                        {fmt(goal.saved_amount)}
                                    </ThemedText>
                                    <ThemedText className="text-[10px] font-bold text-textMuted dark:text-dark-textMuted" style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }}>
                                        {fmt(goal.target_amount)}
                                    </ThemedText>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </AppCard>
        </>
    );
}
