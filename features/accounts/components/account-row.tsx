import { ThemedText } from '@/components/common';
import { UserService } from '@/features/user/services/user-service';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { AccountWithBalance } from '@/lib/db/queries';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

/** Only the first few rows stagger in; the rest appear without animating. */
const ANIMATED_ROWS = 6;

interface AccountRowProps {
    account: AccountWithBalance;
    index: number;
    currency: string;
    onEdit: (account: AccountWithBalance) => void;
    onDelete: (account: AccountWithBalance) => void;
}

/**
 * One payment method in the list. Memoized; callbacks receive the account so
 * the screen can pass stable handlers.
 */
export const AccountRow = React.memo(function AccountRow({ account, index, currency, onEdit, onDelete }: AccountRowProps) {
    const colors = useThemeColors();

    return (
        <Animated.View
            entering={index < ANIMATED_ROWS ? FadeInDown.delay(index * 100).duration(300) : undefined}
            className="bg-surface dark:bg-dark-surface border border-divider dark:border-dark-divider rounded-xl p-4"
        >
            <View className="flex-row items-center">
                <View className="w-12 h-12 items-center justify-center mr-4">
                    <Ionicons
                        name={(account.icon as IoniconsName) || 'wallet'}
                        size={28}
                        color={account.color || colors.primary}
                    />
                </View>
                <View className="flex-1">
                    <ThemedText className="text-lg font-bold mb-1">
                        {account.name}
                    </ThemedText>
                    <ThemedText className="text-sm text-textMuted capitalize mb-1">
                        {account.type}
                    </ThemedText>
                    <ThemedText className="text-base font-semibold text-primary" style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }}>
                        {UserService.formatCurrency(account.balance, currency)}
                    </ThemedText>
                </View>
                <View className="flex-row gap-2">
                    <Pressable
                        onPress={() => onEdit(account)}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${account.name}`}
                        className="w-10 h-10 rounded-xl items-center justify-center"
                        style={{ borderWidth: 1, borderColor: colors.borderStrong }}
                    >
                        <Ionicons name="create-outline" size={20} color={colors.primary} />
                    </Pressable>
                    <Pressable
                        onPress={() => onDelete(account)}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${account.name}`}
                        className="w-10 h-10 rounded-xl items-center justify-center"
                        style={{ borderWidth: 1, borderColor: colors.borderStrong }}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.expense} />
                    </Pressable>
                </View>
            </View>
        </Animated.View>
    );
});
