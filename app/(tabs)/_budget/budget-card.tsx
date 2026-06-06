import { AppCard, ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { UserService } from '@/features/user/services/user-service';
import { BudgetWithSpend } from '@/features/budgets/hooks/use-budgets';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';
import { PERIOD_LABELS, getProgressColor } from './utils';

const RIPPLE_COLOR = 'rgba(36,107,253,0.12)';

interface BudgetCardProps {
    budget: BudgetWithSpend;
    currency: string;
    onEdit: (budget: BudgetWithSpend) => void;
    onDelete: (budget: BudgetWithSpend) => void;
}

export function BudgetCard({ budget, currency, onEdit, onDelete }: BudgetCardProps) {
    const colors = useThemeColors();

    const clampedPercent = Math.min(budget.percentUsed, 100);
    const progressColor = getProgressColor(budget.percentUsed, colors);
    const isOver = budget.remaining < 0;

    const iconColor = budget.categoryColor ?? progressColor;

    return (
        <AppCard circleSize={100} circleOffset={28}>

            {/* Top row: icon + name + badge */}
            <View className="flex-row items-center mb-4">
                <View
                    className="rounded-xl items-center justify-center mr-3"
                    style={{ width: 40, height: 40 }}
                >
                    <Ionicons
                        name={(budget.categoryIcon as IoniconsName) ?? 'wallet-outline'}
                        size={22}
                        color={iconColor}
                    />
                </View>

                <View className="flex-1">
                    <ThemedText className="font-semibold text-sm text-textPrimary dark:text-dark-textPrimary" numberOfLines={1}>
                        {budget.categoryName ?? 'All Categories'}
                    </ThemedText>
                    <ThemedText className="text-[10px] font-semibold text-primary/70">
                        {PERIOD_LABELS[budget.period] ?? budget.period}
                    </ThemedText>
                </View>

                {/* % badge */}
                <View
                    className="px-2.5 py-1 rounded-full"
                    style={{
                        backgroundColor: `${progressColor}18`,
                        borderWidth: 1,
                        borderColor: `${progressColor}35`,
                    }}
                >
                    <ThemedText className="text-[10px] font-bold" style={{ color: progressColor, fontFamily: 'SpaceGrotesk_700Bold' }}>
                        {Math.round(budget.percentUsed)}% USED
                    </ThemedText>
                </View>
            </View>

            {/* Progress bar */}
            <View className="h-2 bg-borderStrong dark:bg-dark-borderStrong rounded-full overflow-hidden mb-2">
                <View
                    style={{ width: `${clampedPercent}%`, backgroundColor: progressColor }}
                    className="h-full rounded-full"
                />
            </View>

            <ThemedText className="text-[10px] font-semibold text-textMuted dark:text-dark-textMuted mb-3" style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }}>
                Limit: {UserService.formatCurrency(budget.amount, currency)}
            </ThemedText>

            {/* Spent / remaining row */}
            <View className="flex-row justify-between items-center mb-3">
                <ThemedText
                    className="font-semibold text-sm text-textPrimary dark:text-dark-textPrimary flex-1 mr-2"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }}
                >
                    {UserService.formatCurrency(budget.spent, currency)} spent
                </ThemedText>
                <ThemedText
                    className="text-sm font-semibold flex-shrink-0"
                    style={{ color: isOver ? colors.error : colors.textMuted, fontFamily: 'SpaceGrotesk_600SemiBold' }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                >
                    {isOver
                        ? `${UserService.formatCurrency(Math.abs(budget.remaining), currency)} over`
                        : `${UserService.formatCurrency(budget.remaining, currency)} left`
                    }
                </ThemedText>
            </View>

            <View className="h-px bg-divider dark:bg-dark-divider mb-3" />

            {/* Action buttons */}
            <View className="flex-row gap-2 justify-end">
                <Pressable
                    onPress={() => onEdit(budget)}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl overflow-hidden"
                    style={{ backgroundColor: `${colors.primary}15` }}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${budget.categoryName ?? 'All Categories'} budget`}
                    android_ripple={{ color: RIPPLE_COLOR, borderless: false }}
                >
                    <Ionicons name="pencil-outline" size={13} color={colors.primary} />
                    <ThemedText className="text-[11px] font-semibold" style={{ color: colors.primary }}>
                        Edit
                    </ThemedText>
                </Pressable>
                <Pressable
                    onPress={() => onDelete(budget)}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl overflow-hidden"
                    style={{ backgroundColor: `${colors.error}15` }}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${budget.categoryName ?? 'All Categories'} budget`}
                    android_ripple={{ color: RIPPLE_COLOR, borderless: false }}
                >
                    <Ionicons name="trash-outline" size={13} color={colors.error} />
                    <ThemedText className="text-[11px] font-semibold" style={{ color: colors.error }}>
                        Delete
                    </ThemedText>
                </Pressable>
            </View>
        </AppCard>
    );
}
