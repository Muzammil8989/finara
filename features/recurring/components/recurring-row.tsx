import { ThemedText } from '@/components/common';
import { UserService } from '@/features/user/services/user-service';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringItem {
    id: number;
    amount: number;
    frequency: RecurringFrequency;
    start_date: string;
    end_date: string | null;
    notes: string | null;
    is_active: number | null;
    category_id: number;
    account_id: number;
    categoryName: string | null;
    categoryIcon: string | null;
    categoryColor: string | null;
    categoryType: string | null;
    accountName: string | null;
}

export const FREQUENCY_LABELS: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
};

/** Only the first few rows stagger in; the rest appear without animating. */
const ANIMATED_ROWS = 6;

interface RecurringRowProps {
    item: RecurringItem;
    index: number;
    currency: string;
    onEdit: (item: RecurringItem) => void;
    onToggleActive: (item: RecurringItem) => void;
    onDelete: (item: RecurringItem) => void;
}

/**
 * One recurring income / expense card. Memoized; callbacks receive the item so
 * the screen can pass stable handlers.
 */
export const RecurringRow = React.memo(function RecurringRow({
    item,
    index,
    currency,
    onEdit,
    onToggleActive,
    onDelete,
}: RecurringRowProps) {
    const colors = useThemeColors();
    const isIncome = item.categoryType === 'income';
    const isPaused = item.is_active !== 1;
    const icon = item.categoryIcon || (isIncome ? 'wallet' : 'fast-food');
    const color = item.categoryColor || colors.primary;

    return (
        <View
            style={{
                opacity: isPaused ? 0.55 : 1,
                marginBottom: 16,
            }}
        >
            <Animated.View
                entering={index < ANIMATED_ROWS ? FadeInDown.delay(index * 50).duration(300) : undefined}
                style={{
                    backgroundColor: colors.backgroundAlt,
                    borderRadius: 24,
                    padding: 20,
                }}
            >
            <View className="flex-row items-center mb-4">
                <View
                    className="mr-4 items-center justify-center"
                    style={{ width: 36, height: 36 }}
                >
                    <Ionicons name={icon as IoniconsName} size={24} color={color} />
                </View>
                <View className="flex-1">
                    <ThemedText className="text-lg font-bold mb-0.5">
                        {item.categoryName || 'Unknown'}
                    </ThemedText>
                    <View className="flex-row items-center gap-2">
                        <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: isIncome ? `${colors.success}20` : `${colors.error}20` }}>
                            <ThemedText className="text-[11px] font-bold" style={{ color: isIncome ? colors.success : colors.error }}>
                                {isIncome ? 'INCOME' : 'EXPENSE'}
                            </ThemedText>
                        </View>
                        <View className="px-2 py-0.5 rounded-md" style={{ borderWidth: 1, borderColor: colors.borderStrong }}>
                            <ThemedText className="text-[11px] font-bold" style={{ color: colors.primary }}>
                                {FREQUENCY_LABELS[item.frequency] || item.frequency}
                            </ThemedText>
                        </View>
                        {isPaused && (
                            <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: `${colors.warning}20` }}>
                                <ThemedText className="text-[11px] font-bold" style={{ color: colors.warning }}>PAUSED</ThemedText>
                            </View>
                        )}
                    </View>
                </View>
                <ThemedText className="text-lg font-bold" style={{ color: isIncome ? colors.success : colors.error, fontFamily: 'SpaceGrotesk_700Bold' }}>
                    {isIncome ? '+' : '-'}{UserService.formatCurrency(item.amount, currency)}
                </ThemedText>
            </View>

            {/* Info row */}
            <View className="flex-row items-center mb-4 pl-[52px]">
                {item.accountName && (
                    <View className="flex-row items-center mr-4">
                        <Ionicons name="wallet-outline" size={12} color={colors.textMuted} />
                        <ThemedText className="text-xs ml-1" style={{ color: colors.textMuted }}>{item.accountName}</ThemedText>
                    </View>
                )}
                {item.notes && (
                    <View className="flex-row items-center flex-1">
                        <Ionicons name="document-text-outline" size={12} color={colors.textMuted} />
                        <ThemedText className="text-xs ml-1 flex-1" style={{ color: colors.textMuted }} numberOfLines={1}>{item.notes}</ThemedText>
                    </View>
                )}
            </View>

            {/* Action buttons */}
            <View className="flex-row gap-2 pl-[52px]">
                <Pressable
                    onPress={() => onEdit(item)}
                    className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl"
                    style={{ backgroundColor: `${colors.primary}10` }}
                >
                    <Ionicons name="create-outline" size={16} color={colors.primary} />
                    <ThemedText className="text-xs font-bold" style={{ color: colors.primary }}>Edit</ThemedText>
                </Pressable>
                <Pressable
                    onPress={() => onToggleActive(item)}
                    className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl"
                    style={{ backgroundColor: isPaused ? `${colors.success}10` : `${colors.warning}10` }}
                >
                    <Ionicons name={isPaused ? 'play' : 'pause'} size={16} color={isPaused ? colors.success : colors.warning} />
                    <ThemedText className="text-xs font-bold" style={{ color: isPaused ? colors.success : colors.warning }}>
                        {isPaused ? 'Resume' : 'Pause'}
                    </ThemedText>
                </Pressable>
                <Pressable
                    onPress={() => onDelete(item)}
                    className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl"
                    style={{ backgroundColor: `${colors.error}10` }}
                >
                    <Ionicons name="trash-outline" size={16} color={colors.expense} />
                    <ThemedText className="text-xs font-bold" style={{ color: colors.expense }}>Delete</ThemedText>
                </Pressable>
            </View>
        </Animated.View>
        </View>
    );
});
