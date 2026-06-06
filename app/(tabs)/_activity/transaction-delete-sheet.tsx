import { AppButton, BottomSheet, BottomSheetRef, ThemedText } from '@/components/common';
import { UserService } from '@/features/user/services/user-service';
import type { Transaction } from '@/features/transactions/hooks/use-transactions';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ERROR_COLOR = '#EF4444';
const DELETE_GRADIENT = [`${ERROR_COLOR}18`, `${ERROR_COLOR}06`, 'transparent'] as const;

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
            gradientColors={DELETE_GRADIENT}
        >
            <View className="w-16 h-16 rounded-3xl items-center justify-center mx-auto mb-5">
                <Ionicons name="trash-outline" size={30} color={ERROR_COLOR} />
            </View>

            <ThemedText type="subtitle" className="text-center text-textPrimary dark:text-dark-textPrimary mb-2">
                Delete Transaction
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
