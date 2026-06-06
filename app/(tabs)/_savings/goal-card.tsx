import { AppCard, ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { UserService } from '@/features/user/services/user-service';
import type { SavingsGoal } from '@/lib/db/schema';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

interface GoalCardProps {
    goal: SavingsGoal;
    currency: string;
    onEdit: () => void;
    onDelete: () => void;
    onContribute: () => void;
}

export function GoalCard({ goal, currency, onEdit, onDelete, onContribute }: GoalCardProps) {
    const colors = useThemeColors();

    const pct = goal.target_amount > 0
        ? Math.min((goal.saved_amount / goal.target_amount) * 100, 100)
        : 0;
    const color = goal.color ?? colors.primary;
    const isCompleted = goal.is_completed === 1 || pct >= 100;

    const daysLeft = goal.deadline
        ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;
    const isOverdue = daysLeft !== null && daysLeft < 0;

    return (
        <AppCard accentColor={color} circleSize={80} circleOffset={18}>

            {/* Header row */}
            <View className="flex-row items-center mb-3">
                <View
                    className="items-center justify-center mr-3 shrink-0"
                    style={{ width: 36, height: 36 }}
                >
                    <Ionicons name={(goal.icon as IoniconsName) ?? 'wallet-outline'} size={20} color={color} />
                </View>

                <View className="flex-1">
                    <ThemedText className="font-semibold text-sm text-textPrimary dark:text-dark-textPrimary" numberOfLines={1}>
                        {goal.name}
                    </ThemedText>
                    {goal.deadline ? (
                        <ThemedText
                            className="text-[10px] font-semibold"
                            style={{ color: isOverdue ? colors.error : `${color}99` }}
                        >
                            {isOverdue
                                ? `Overdue by ${Math.abs(daysLeft!)}d`
                                : daysLeft === 0
                                    ? 'Due today!'
                                    : `${daysLeft}d left · ${new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                            }
                        </ThemedText>
                    ) : (
                        <ThemedText className="text-[10px] text-textMuted dark:text-dark-textMuted">No deadline</ThemedText>
                    )}
                </View>

                {/* % badge */}
                <View
                    className="px-2.5 py-1 rounded-full"
                    style={{
                        backgroundColor: isCompleted ? `${colors.success}18` : `${color}18`,
                        borderWidth: 1,
                        borderColor: isCompleted ? `${colors.success}35` : `${color}35`,
                    }}
                >
                    <ThemedText className="text-[10px] font-bold" style={{ color: isCompleted ? colors.success : color, fontFamily: 'SpaceGrotesk_700Bold' }}>
                        {isCompleted ? 'DONE' : `${Math.round(pct)}%`}
                    </ThemedText>
                </View>
            </View>

            {/* Progress bar */}
            <View className="h-2.5 bg-borderStrong dark:bg-dark-borderStrong rounded-full overflow-hidden mb-2">
                <View
                    style={{ width: `${pct}%`, backgroundColor: isCompleted ? colors.success : color }}
                    className="h-full rounded-full"
                />
            </View>

            <View className="flex-row justify-between items-center mb-3">
                <ThemedText className="text-sm font-bold text-textPrimary dark:text-dark-textPrimary flex-1 mr-2" numberOfLines={1} style={{ fontFamily: 'SpaceGrotesk_700Bold' }}>
                    {UserService.formatCurrency(goal.saved_amount, currency)}
                    <ThemedText className="text-xs text-textMuted dark:text-dark-textMuted"> saved</ThemedText>
                </ThemedText>
                <ThemedText className="text-sm text-textMuted dark:text-dark-textMuted flex-shrink-0" numberOfLines={1} style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }}>
                    of {UserService.formatCurrency(goal.target_amount, currency)}
                </ThemedText>
            </View>

            <View className="h-px bg-divider dark:bg-dark-divider mb-3" />

            {/* Action buttons */}
            <View className="flex-row gap-2 justify-end">
                {!isCompleted && (
                    <Pressable
                        onPress={onContribute}
                        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
                        style={{ backgroundColor: `${color}18` }}
                    >
                        <Ionicons name="add-circle-outline" size={13} color={color} />
                        <ThemedText className="text-[11px] font-semibold" style={{ color }}>Add</ThemedText>
                    </Pressable>
                )}
                <Pressable
                    onPress={onEdit}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
                    style={{ backgroundColor: `${colors.primary}15` }}
                >
                    <Ionicons name="pencil-outline" size={13} color={colors.primary} />
                    <ThemedText className="text-[11px] font-semibold" style={{ color: colors.primary }}>Edit</ThemedText>
                </Pressable>
                <Pressable
                    onPress={onDelete}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
                    style={{ backgroundColor: `${colors.error}15` }}
                >
                    <Ionicons name="trash-outline" size={13} color={colors.error} />
                    <ThemedText className="text-[11px] font-semibold" style={{ color: colors.error }}>Delete</ThemedText>
                </Pressable>
            </View>
        </AppCard>
    );
}
