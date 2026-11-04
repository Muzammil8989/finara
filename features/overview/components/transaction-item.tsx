/**
 * TransactionItem — one transaction as a ruled list row.
 *
 *   [icon]  Category                      +$1,200.00
 *           Note                              Nov 4
 *   ───────────────────────────────────────────────── hairline
 */

import { ThemedText } from '@/components/common';
import type { Transaction } from '@/features/transactions/hooks/use-transactions';
import { UserService } from '@/features/user/services/user-service';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { parseLocalDate } from '@/lib/utils/date';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Pressable } from '@/components/common/pressable';

const FALLBACK_ICON: Record<'income' | 'expense', IoniconsName> = {
    income: 'arrow-down-outline',
    expense: 'arrow-up-outline',
};

function formatTxDate(dateStr: string | null): string | null {
    if (!dateStr) return null;
    return parseLocalDate(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
}

interface TransactionItemProps {
    tx: Transaction;
    /** Kept for API compatibility with list callers; rows no longer stagger-animate. */
    index?: number;
    currency: string;
    onPress?: () => void;
    style?: ViewStyle;
    /** Hide the date (e.g. when rows are already grouped under a date heading). */
    hideDate?: boolean;
    /** Draw the bottom hairline (default true). */
    ruled?: boolean;
}

export const TransactionItem = React.memo(function TransactionItem({
    tx,
    currency,
    onPress,
    style,
    hideDate = false,
    ruled = true,
}: TransactionItemProps) {
    const colors = useThemeColors();
    const isIncome = tx.type === 'income';

    const iconName = (tx.categoryIcon as IoniconsName) ?? FALLBACK_ICON[tx.type];
    const iconColor = tx.categoryColor ?? colors.textSecondary;
    const formattedDate = hideDate ? null : formatTxDate(tx.date);
    const formattedAmount = UserService.formatCurrency(tx.amount, currency);

    const accessibilityLabel = [
        isIncome ? 'Income' : 'Expense',
        formattedAmount,
        tx.category,
        tx.note ?? null,
        formatTxDate(tx.date),
    ]
        .filter(Boolean)
        .join(', ');

    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            accessible
            accessibilityLabel={accessibilityLabel}
            accessibilityRole={onPress ? 'button' : undefined}
            className={`flex-row items-center py-3.5 ${ruled ? 'border-b border-divider dark:border-dark-divider' : ''}`}
            style={({ pressed }) => [style, pressed && onPress ? { opacity: 0.6 } : null]}
        >
            <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3 border border-divider dark:border-dark-divider"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
            >
                <Ionicons name={iconName} size={17} color={iconColor} />
            </View>

            <View className="flex-1 mr-3">
                <ThemedText type="defaultSemiBold" className="text-[15px] leading-5" numberOfLines={1}>
                    {tx.category}
                </ThemedText>
                {tx.note ? (
                    <ThemedText type="caption" className="mt-0.5" numberOfLines={1}>
                        {tx.note}
                    </ThemedText>
                ) : null}
            </View>

            <View className="items-end">
                <ThemedText
                    type="figure"
                    className="text-[15px]"
                    style={{ color: isIncome ? colors.income : colors.textPrimary }}
                    numberOfLines={1}
                >
                    {isIncome ? '+' : '−'}{formattedAmount}
                </ThemedText>
                {formattedDate && (
                    <ThemedText type="caption" className="mt-0.5">
                        {formattedDate}
                    </ThemedText>
                )}
            </View>
        </Pressable>
    );
});
