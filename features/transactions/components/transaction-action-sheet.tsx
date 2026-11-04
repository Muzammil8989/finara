import { AppButton, BottomSheet, BottomSheetRef, SheetHeader, ThemedText } from '@/components/common';
import type { Transaction } from '@/features/transactions/hooks/use-transactions';
import { UserService } from '@/features/user/services/user-service';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { parseLocalDate } from '@/lib/utils/date';
import React, { useRef } from 'react';
import { linkedSource } from '../utils';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TransactionActionSheetProps {
    transaction: Transaction;
    onEdit: () => void;
    onDelete: () => void;
    onClose: () => void;
    profile: { currency: string };
}

/**
 * Opens when a transaction is tapped: the full record, then Edit / Delete.
 */
export function TransactionActionSheet({ transaction, onEdit, onDelete, onClose, profile }: TransactionActionSheetProps) {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const sheetRef = useRef<BottomSheetRef>(null);
    const isIncome = transaction.type === 'income';
    const source = linkedSource(transaction);

    const handleClose = (callback?: () => void) => {
        sheetRef.current?.dismiss(callback ?? onClose);
    };

    const rows: { label: string; value: string }[] = [
        {
            label: 'Date',
            value: transaction.date
                ? parseLocalDate(transaction.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
                : '—',
        },
        { label: 'Account', value: transaction.accountName || 'Cash' },
        { label: 'Type', value: isIncome ? 'Income' : 'Expense' },
        ...(transaction.note ? [{ label: 'Note', value: transaction.note }] : []),
    ];

    return (
        <BottomSheet
            ref={sheetRef}
            visible
            onClose={onClose}
            paddingHorizontal={24}
            paddingTop={16}
            paddingBottom={Math.max(insets.bottom + 16, 24)}
        >
            <SheetHeader kicker={isIncome ? 'Income' : 'Expense'} title={transaction.category || 'Other'} onClose={() => handleClose()} />

            <ThemedText
                type="figureLg"
                style={{ color: isIncome ? colors.income : colors.textPrimary }}
                accessibilityLabel={`${isIncome ? 'Plus' : 'Minus'} ${UserService.formatCurrency(transaction.amount, profile.currency)}`}
            >
                {isIncome ? '+' : '−'}{UserService.formatCurrency(transaction.amount, profile.currency)}
            </ThemedText>

            <View className="mt-4 mb-6 border-t border-divider dark:border-dark-divider">
                {rows.map(r => (
                    <View key={r.label} className="flex-row py-3 border-b border-divider dark:border-dark-divider" accessible accessibilityLabel={`${r.label}: ${r.value}`}>
                        <ThemedText type="caption" className="w-20 pt-0.5">{r.label}</ThemedText>
                        <ThemedText className="flex-1 text-[15px]">{r.value}</ThemedText>
                    </View>
                ))}
            </View>

            {source ? (
                <View className="rounded-xl px-4 py-3 bg-infoBg dark:bg-dark-infoBg" accessible>
                    <ThemedText className="text-[14px] leading-5" style={{ color: colors.infoText }}>
                        {source === 'Transfers'
                            ? 'Part of a transfer between your accounts. To change it, delete it and add the transfer again — both sides are removed together.'
                            : `Created by ${source}. To change the amount, edit it in ${source} so the figures stay in step.`}
                    </ThemedText>
                </View>
            ) : (
                <AppButton label="Edit" icon="pencil-outline" onPress={() => handleClose(onEdit)} />
            )}
            {/* Keep the long, explicit label for screen readers and tests */}
            <Pressable
                onPress={() => handleClose(onDelete)}
                accessibilityRole="button"
                accessibilityLabel="Delete transaction"
                className="mt-2 min-h-[48px] items-center justify-center"
            >
                <ThemedText type="label" style={{ color: colors.expense }}>Delete transaction</ThemedText>
            </Pressable>
        </BottomSheet>
    );
}
