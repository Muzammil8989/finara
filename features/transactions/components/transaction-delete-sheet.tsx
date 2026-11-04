import { AppButton, BottomSheet, BottomSheetRef, ThemedText } from '@/components/common';
import { UserService } from '@/features/user/services/user-service';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { Transaction } from '@/features/transactions/hooks/use-transactions';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const AMOUNT_INLINE_TEXT = {
    income: 'font-bold text-income',
    expense: 'font-bold text-expense',
} as const;

interface TransactionDeleteSheetProps {
    transaction: Transaction;
    onCancel: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
    profile: { currency: string };
}

export function TransactionDeleteSheet({ transaction, onCancel, onConfirm, isDeleting, profile }: TransactionDeleteSheetProps) {
    const colors = useThemeColors();
    const isIncome = transaction.type === 'income';
    const insets = useSafeAreaInsets();
    const sheetRef = useRef<BottomSheetRef>(null);

    const handleClose = (callback?: () => void) => {
        sheetRef.current?.dismiss(callback ?? onCancel);
    };

    return (
        <BottomSheet
            ref={sheetRef}
            visible
            onClose={onCancel}
            paddingHorizontal={20}
            paddingTop={32}
            paddingBottom={Math.max(insets.bottom + 16, 24)}
        >
            <View className="w-16 h-16 rounded-full items-center justify-center mx-auto mb-5 border border-divider dark:border-dark-divider">
                <Ionicons name="trash-outline" size={28} color={colors.expense} />
            </View>

            <ThemedText type="headline" className="text-center mb-2">
                Delete transaction
            </ThemedText>

            <ThemedText type="small" className="text-center text-textMuted dark:text-dark-textMuted leading-6 mb-2 px-4">
                Delete{' '}
                <ThemedText className="font-bold text-textPrimary dark:text-dark-textPrimary">
                    {transaction.category || 'this transaction'}
                </ThemedText>
                {' '}for{' '}
                <ThemedText className={AMOUNT_INLINE_TEXT[isIncome ? 'income' : 'expense']} style={{ fontFamily: 'SpaceGrotesk_700Bold' }}>
                    {UserService.formatCurrency(transaction.amount, profile.currency)}
                </ThemedText>
                {'?'}
            </ThemedText>

            <ThemedText className="text-xs text-center text-textMuted dark:text-dark-textMuted mb-8">
                This action cannot be undone.
            </ThemedText>

            <View className="flex-row gap-3">
                <AppButton label="Cancel" onPress={() => handleClose()} variant="secondary" flex />
                <AppButton label="Delete" onPress={() => handleClose(onConfirm)} variant="destructive" loading={isDeleting} disabled={isDeleting} flex />
            </View>
        </BottomSheet>
    );
}
