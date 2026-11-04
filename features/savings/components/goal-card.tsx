import { ProgressRing, ThemedText } from '@/components/common';
import { UserService } from '@/features/user/services/user-service';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { SavingsGoal } from '@/lib/db/schema';
import { diffCalendarDays, parseLocalDate } from '@/lib/utils/date';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { Pressable } from '@/components/common/pressable';
import { monthlyPaceNeeded } from '../utils';

interface GoalCardProps {
    goal: SavingsGoal;
    currency: string;
    onEdit: () => void;
    onDelete: () => void;
    onContribute: () => void;
}

/**
 * One goal as a ruled row: progress ring, name and deadline, saved / target,
 * and — when there's a deadline — what it takes per month to get there.
 */
export function GoalCard({ goal, currency, onEdit, onDelete, onContribute }: GoalCardProps) {
    const colors = useThemeColors();

    const pct = goal.target_amount > 0
        ? Math.min((goal.saved_amount / goal.target_amount) * 100, 100)
        : 0;
    const color = goal.color ?? colors.primary;
    const isCompleted = goal.is_completed === 1 || pct >= 100;

    const daysLeft = goal.deadline
        ? diffCalendarDays(new Date(), parseLocalDate(goal.deadline))
        : null;
    const isOverdue = daysLeft !== null && daysLeft < 0;

    const deadlineText = !goal.deadline
        ? 'No deadline'
        : isOverdue
            ? `Overdue by ${Math.abs(daysLeft!)}d`
            : daysLeft === 0
                ? 'Due today'
                : `${daysLeft}d left · ${parseLocalDate(goal.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

    const pace = !isCompleted && daysLeft !== null && daysLeft > 0
        ? monthlyPaceNeeded(goal.target_amount - goal.saved_amount, daysLeft)
        : null;

    const saved = UserService.formatCurrency(goal.saved_amount, currency);
    const target = UserService.formatCurrency(goal.target_amount, currency);

    return (
        <View className="py-4 border-b border-divider dark:border-dark-divider">
            <Pressable
                onPress={onEdit}
                onLongPress={onDelete}
                accessibilityRole="button"
                accessibilityLabel={`${goal.name}. ${saved} of ${target} saved, ${Math.round(pct)} percent. ${deadlineText}.`}
                accessibilityHint="Opens the goal to edit"
                accessibilityActions={[{ name: 'activate', label: 'Edit' }, { name: 'delete', label: 'Delete' }]}
                onAccessibilityAction={e => (e.nativeEvent.actionName === 'delete' ? onDelete() : onEdit())}
                className="flex-row items-center"
                style={({ pressed }) => pressed && { opacity: 0.7 }}
            >
                <ProgressRing
                    percent={pct}
                    size={48}
                    color={isCompleted ? colors.income : color}
                    label={isCompleted ? null : undefined}
                />
                {isCompleted && (
                    <Ionicons name="checkmark" size={20} color={colors.income} style={{ position: 'absolute', left: 14 }} />
                )}

                <View className="flex-1 mx-3">
                    <ThemedText type="defaultSemiBold" className="text-[15px] leading-5" numberOfLines={1}>
                        {goal.name}
                    </ThemedText>
                    <ThemedText type="caption" style={isOverdue ? { color: colors.expense } : undefined}>
                        {isCompleted ? 'Completed' : deadlineText}
                    </ThemedText>
                </View>

                <View className="items-end">
                    <ThemedText type="figure" className="text-[15px]" numberOfLines={1}>{saved}</ThemedText>
                    <ThemedText type="caption" style={{ fontVariant: ['tabular-nums'] }}>of {target}</ThemedText>
                </View>
            </Pressable>

            {!isCompleted && (
                <View className="flex-row items-center justify-between mt-2 pl-[60px]">
                    <ThemedText type="caption" className="flex-1 mr-2" numberOfLines={1}>
                        {pace != null ? `Needs ${UserService.formatCurrency(pace, currency)}/month` : ' '}
                    </ThemedText>
                    <Pressable
                        onPress={onContribute}
                        accessibilityRole="button"
                        accessibilityLabel={`Add money to ${goal.name}`}
                        hitSlop={8}
                        className="flex-row items-center min-h-[36px] px-3 rounded-full border border-borderStrong dark:border-dark-borderStrong"
                        style={({ pressed }) => pressed && { backgroundColor: colors.backgroundAlt }}
                    >
                        <Ionicons name="add" size={14} color={colors.primary} />
                        <ThemedText type="label" className="ml-1" style={{ color: colors.primary }}>Add money</ThemedText>
                    </Pressable>
                </View>
            )}
        </View>
    );
}
