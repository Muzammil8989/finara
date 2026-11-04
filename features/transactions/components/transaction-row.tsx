import { ThemedText } from '@/components/common';
import type { Transaction } from '@/features/transactions/hooks/use-transactions';
import { UserService } from '@/features/user/services/user-service';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { Pressable } from '@/components/common/pressable';
import { getCategoryStyle } from '../utils';

interface TransactionRowProps {
    item: Transaction;
    index: number;
    currency: string;
    /** Tap opens the details / actions sheet. */
    onPress?: (t: Transaction) => void;
    onLongPress: (t: Transaction) => void;
    /** Draw the bottom hairline (false for the last row of a day). */
    ruled?: boolean;
}

/**
 * One transaction in the Activity list:
 *
 *   (icon)  Groceries                       −$84.10
 *           Weekly shop · Cash
 */
export const TransactionRow = React.memo(function TransactionRow({
    item,
    currency,
    onPress,
    onLongPress,
    ruled = true,
}: TransactionRowProps) {
    const colors = useThemeColors();
    const isDark = useColorScheme() === 'dark';
    const categoryStyle = getCategoryStyle(item.categoryIcon, item.categoryColor, item.type, isDark, colors);
    const isIncome = item.type === 'income';
    const amount = UserService.formatCurrency(item.amount, currency);
    const category = item.category || 'Other';
    const account = item.accountName || 'Cash';
    const detail = [item.note, account].filter(Boolean).join(' · ');

    return (
        <Pressable
            onPress={() => (onPress ?? onLongPress)(item)}
            onLongPress={() => onLongPress(item)}
            accessibilityRole="button"
            // Ends with the type so lists can be queried by it ("… income").
            accessibilityLabel={`${category}, ${isIncome ? '+' : 'minus '}${amount}, ${detail} ${item.type}`}
            accessibilityHint="Shows details, edit and delete"
            className="px-5"
            style={({ pressed }) => pressed && { backgroundColor: colors.backgroundAlt }}
        >
            <View className={`flex-row items-center py-3.5 ${ruled ? 'border-b border-divider dark:border-dark-divider' : ''}`}>
                <View
                    className="w-9 h-9 rounded-full items-center justify-center mr-3 border border-divider dark:border-dark-divider"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                >
                    <Ionicons name={categoryStyle.icon as IoniconsName} size={17} color={categoryStyle.iconColor} />
                </View>

                <View className="flex-1 min-w-0 mr-3">
                    <ThemedText type="defaultSemiBold" className="text-[15px] leading-5" numberOfLines={1}>
                        {category}
                    </ThemedText>
                    <ThemedText type="caption" className="mt-0.5" numberOfLines={1}>
                        {detail}
                    </ThemedText>
                </View>

                <ThemedText
                    type="figure"
                    className="text-[15px]"
                    style={{ color: isIncome ? colors.income : colors.textPrimary }}
                    numberOfLines={1}
                >
                    {isIncome ? '+' : '−'}{amount}
                </ThemedText>
            </View>
        </Pressable>
    );
});
