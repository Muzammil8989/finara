import { ThemedText } from '@/components/common';
import { BudgetWithSpend } from '@/features/budgets/hooks/use-budgets';
import { UserService } from '@/features/user/services/user-service';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { Pressable } from '@/components/common/pressable';
import { PERIOD_LABELS, getBudgetStatus } from '../utils';

interface BudgetCardProps {
    budget: BudgetWithSpend;
    currency: string;
    onEdit: (budget: BudgetWithSpend) => void;
    onDelete: (budget: BudgetWithSpend) => void;
}

/**
 * One budget as a ruled row: name, spent / limit, a thin bar with the alert
 * threshold marked, and a plain-language status. Tap to edit (delete lives in
 * the edit sheet); screen readers also get Edit/Delete actions.
 */
export function BudgetCard({ budget, currency, onEdit, onDelete }: BudgetCardProps) {
    const colors = useThemeColors();
    const name = budget.categoryName ?? 'All categories';
    const threshold = budget.alert_threshold ?? 80;
    const status = getBudgetStatus(budget.percentUsed, threshold);
    const statusColor =
        status.tone === 'over' ? colors.expense :
        status.tone === 'near' ? colors.warning :
        colors.textSecondary;
    const barColor =
        status.tone === 'over' ? colors.expense :
        status.tone === 'near' ? colors.warning :
        colors.primary;

    const spent = UserService.formatCurrency(budget.spent, currency);
    const limit = UserService.formatCurrency(budget.amount, currency);
    const statusText = status.tone === 'over'
        ? `Over by ${UserService.formatCurrency(Math.abs(budget.remaining), currency)}`
        : status.tone === 'near'
            ? `${Math.round(budget.percentUsed)}% · Near limit`
            : `${UserService.formatCurrency(budget.remaining, currency)} left`;

    return (
        <Pressable
            onPress={() => onEdit(budget)}
            accessibilityRole="button"
            accessibilityLabel={`${name}, ${PERIOD_LABELS[budget.period] ?? budget.period}. ${spent} of ${limit} spent. ${statusText}.`}
            accessibilityHint="Opens the budget to edit"
            accessibilityActions={[{ name: 'activate', label: 'Edit' }, { name: 'delete', label: 'Delete' }]}
            onAccessibilityAction={e => {
                if (e.nativeEvent.actionName === 'delete') onDelete(budget);
                else onEdit(budget);
            }}
            onLongPress={() => onDelete(budget)}
            className="py-4 border-b border-divider dark:border-dark-divider"
            style={({ pressed }) => pressed && { opacity: 0.7 }}
        >
            <View className="flex-row items-center mb-3">
                <View
                    className="w-9 h-9 rounded-full items-center justify-center mr-3 border border-divider dark:border-dark-divider"
                >
                    <Ionicons
                        name={(budget.categoryIcon as IoniconsName) ?? 'wallet-outline'}
                        size={18}
                        color={budget.categoryColor ?? colors.textSecondary}
                    />
                </View>

                <View className="flex-1 mr-3">
                    <ThemedText type="defaultSemiBold" className="text-[15px] leading-5" numberOfLines={1}>
                        {name}
                    </ThemedText>
                    <ThemedText type="caption">
                        {PERIOD_LABELS[budget.period] ?? budget.period}
                    </ThemedText>
                </View>

                <View className="items-end">
                    <ThemedText type="figure" className="text-[15px]" numberOfLines={1}>
                        {spent}
                    </ThemedText>
                    <ThemedText type="caption" style={{ fontVariant: ['tabular-nums'] }}>of {limit}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 8 }} />
            </View>

            {/* Thin bar with a tick at the alert threshold */}
            <View className="h-1.5 rounded-full bg-backgroundAlt dark:bg-dark-surfaceAlt">
                <View
                    style={{ width: `${Math.min(budget.percentUsed, 100)}%`, backgroundColor: barColor }}
                    className="h-full rounded-full"
                />
                {threshold > 0 && threshold < 100 && (
                    <View
                        style={{
                            position: 'absolute', left: `${threshold}%`, top: -3, bottom: -3, width: 1.5,
                            backgroundColor: colors.textMuted,
                        }}
                    />
                )}
            </View>

            <View className="flex-row items-center mt-2">
                {status.tone !== 'ok' && (
                    <Ionicons
                        name={status.tone === 'over' ? 'alert-circle' : 'warning-outline'}
                        size={13}
                        color={statusColor}
                        style={{ marginRight: 4 }}
                    />
                )}
                <ThemedText type="caption" style={{ color: statusColor }}>
                    {statusText}
                </ThemedText>
            </View>
        </Pressable>
    );
}
