import { AppCard, ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { UserService } from '@/features/user/services/user-service';
import type { Transaction } from '@/features/transactions/hooks/use-transactions';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getCategoryStyle } from './utils';

const INCOME_COLOR  = '#10B981';
const EXPENSE_COLOR = '#EF4444';
const RIPPLE_COLOR  = 'rgba(36,107,253,0.12)';

const MONTH = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(date: string | null): string {
    if (!date) return '';
    const parts = date.split('-');
    if (parts.length < 3) return '';
    return `${MONTH[parseInt(parts[1], 10) - 1]} ${parseInt(parts[2], 10)}`;
}

interface TransactionRowProps {
    item: Transaction;
    index: number;
    currency: string;
    onLongPress: (t: Transaction) => void;
}

export function TransactionRow({ item, index, currency, onLongPress }: TransactionRowProps) {
    const colors = useThemeColors();
    const isDark = useColorScheme() === 'dark';
    const categoryStyle = getCategoryStyle(item.categoryIcon, item.categoryColor, item.type, isDark, colors);

    // Use category color for card accent — makes each card visually distinct from the blue overview cards
    const accentColor = categoryStyle.iconColor;
    const amountColor = item.type === 'income' ? INCOME_COLOR : EXPENSE_COLOR;

    return (
        <Animated.View entering={FadeInDown.delay(index * 20).duration(350)} className="px-5">
            <AppCard
                accentColor={accentColor}
                circleSize={80}
                circleOffset={18}
                onLongPress={() => onLongPress(item)}
                androidRipple={{ color: RIPPLE_COLOR, borderless: false }}
                accessibilityRole="button"
                accessibilityLabel={`${item.category || 'Other'} ${item.type}`}
                accessibilityHint="Long press for options"
            >

                {/* Header row */}
                <View className="flex-row items-center mb-3">
                    <View
                        style={{
                            width: 40, height: 40,
                            alignItems: 'center', justifyContent: 'center',
                            marginRight: 12, flexShrink: 0,
                        }}
                    >
                        <Ionicons name={categoryStyle.icon as IoniconsName} size={22} color={accentColor} />
                    </View>

                    <View className="flex-1 min-w-0">
                        <ThemedText
                            className="font-semibold text-sm text-textPrimary dark:text-dark-textPrimary"
                            numberOfLines={1}
                        >
                            {item.category || 'Other'}
                        </ThemedText>
                        <ThemedText
                            className="text-[10px] font-semibold text-textMuted dark:text-dark-textMuted mt-0.5"
                            numberOfLines={1}
                        >
                            {item.note || 'No description'}
                        </ThemedText>
                    </View>

                    {/* Amount pill badge — mirrors savings goal % badge */}
                    <View
                        className="px-2.5 py-1 rounded-full ml-2 shrink-0"
                        style={{
                            backgroundColor: `${amountColor}18`,
                            borderWidth: 1,
                            borderColor: `${amountColor}35`,
                        }}
                    >
                        <ThemedText className="text-[11px] font-bold" style={{ color: amountColor, fontFamily: 'SpaceGrotesk_700Bold' }}>
                            {item.type === 'income' ? '+' : '-'}{UserService.formatCurrency(item.amount, currency)}
                        </ThemedText>
                    </View>
                </View>

                {/* Divider — same as savings goal card */}
                <View className="h-px bg-divider dark:bg-dark-divider mb-3" />

                {/* Footer: account + date */}
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1.5">
                        <Ionicons name="wallet-outline" size={11} color={colors.textMuted} />
                        <ThemedText
                            className="text-[10px] font-semibold text-textMuted dark:text-dark-textMuted"
                            numberOfLines={1}
                        >
                            {item.accountName || 'Cash'}
                        </ThemedText>
                    </View>
                    <ThemedText className="text-[10px] font-semibold text-textMuted dark:text-dark-textMuted">
                        {formatDate(item.date)}
                    </ThemedText>
                </View>
            </AppCard>
        </Animated.View>
    );
}
