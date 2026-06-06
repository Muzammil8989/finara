import { BottomSheet, BottomSheetRef, ThemedText } from '@/components/common';
import { shadows } from '@/theme/shadows';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { UserService } from '@/features/user/services/user-service';
import type { Transaction } from '@/features/transactions/hooks/use-transactions';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Identical in light + dark — module-level constants, no hook
const PRIMARY_COLOR = '#246BFD';
const SUCCESS_COLOR = '#10B981';
const ERROR_COLOR = '#EF4444';
const RIPPLE_COLOR = 'rgba(36,107,253,0.12)';

// Pre-computed alpha-hex strings (inline style values, not NativeWind classes)
const PRIMARY_BG_LIGHT = `${PRIMARY_COLOR}10` as const;
const ERROR_BG_LIGHT = `${ERROR_COLOR}10` as const;

// Static configs — never build NativeWind classes dynamically
const AMOUNT_TEXT = {
    income: 'font-bold text-income',
    expense: 'font-bold text-expense',
} as const;

const GRADIENT_COLORS_DARK = ['rgba(36,107,253,0.08)', 'transparent'] as const;
const GRADIENT_COLORS_LIGHT = ['rgba(36,107,253,0.04)', 'transparent'] as const;

interface TransactionActionSheetProps {
    transaction: Transaction;
    onEdit: () => void;
    onDelete: () => void;
    onClose: () => void;
    profile: { currency: string };
}

export function TransactionActionSheet({ transaction, onEdit, onDelete, onClose, profile }: TransactionActionSheetProps) {
    const isDark = useColorScheme() === 'dark';
    const isIncome = transaction.type === 'income';
    const insets = useSafeAreaInsets();
    const sheetRef = useRef<BottomSheetRef>(null);

    const handleClose = (callback?: () => void) => {
        sheetRef.current?.dismiss(callback ?? onClose);
    };

    return (
        <BottomSheet
            ref={sheetRef}
            visible
            onClose={onClose}
            paddingHorizontal={24}
            paddingTop={32}
            paddingBottom={Math.max(insets.bottom + 16, 24)}
            gradientColors={isDark ? GRADIENT_COLORS_DARK : GRADIENT_COLORS_LIGHT}
        >
            {/* Transaction preview */}
            <View className="flex-row items-center bg-backgroundAlt dark:bg-dark-backgroundAlt rounded-2xl p-4 mb-6">
                <View className="w-10 h-10 rounded-2xl items-center justify-center mr-3">
                    <Ionicons
                        name={isIncome ? 'arrow-down' : 'receipt'}
                        size={18}
                        color={isIncome ? SUCCESS_COLOR : ERROR_COLOR}
                    />
                </View>
                <View className="flex-1">
                    <ThemedText type="small" className="font-semibold text-textPrimary dark:text-dark-textPrimary" numberOfLines={1}>
                        {transaction.category || 'Other'}
                    </ThemedText>
                    <ThemedText className="text-[10px] text-textMuted dark:text-dark-textMuted" numberOfLines={1}>
                        {transaction.note || 'No description'}
                    </ThemedText>
                </View>
                <ThemedText
                    className={`ml-2 flex-shrink-0 ${AMOUNT_TEXT[isIncome ? 'income' : 'expense']}`}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
                >
                    {isIncome ? '+' : '-'}{UserService.formatCurrency(transaction.amount, profile.currency)}
                </ThemedText>
            </View>

            {/* Edit */}
            <Pressable
                onPress={() => handleClose(onEdit)}
                className="flex-row items-center gap-4 px-4 py-4 rounded-2xl mb-2 overflow-hidden"
                style={{ backgroundColor: PRIMARY_BG_LIGHT }}
                android_ripple={{ color: RIPPLE_COLOR, borderless: false }}
                accessibilityRole="button"
                accessibilityLabel="Edit transaction"
            >
                {({ pressed }) => (
                    <>
                        <View className="w-9 h-9 rounded-2xl items-center justify-center">
                            <Ionicons name="pencil-outline" size={18} color={PRIMARY_COLOR} />
                        </View>
                        <ThemedText type="small" className="font-semibold flex-1 text-primary">
                            Edit Transaction
                        </ThemedText>
                        <Ionicons name="chevron-forward" size={16} color={PRIMARY_COLOR} />
                        {pressed && Platform.OS === 'ios' && (
                            <View style={[StyleSheet.absoluteFillObject, styles.pressedOverlay]} />
                        )}
                    </>
                )}
            </Pressable>

            {/* Delete */}
            <Pressable
                onPress={() => handleClose(onDelete)}
                className="flex-row items-center gap-4 px-4 py-4 rounded-2xl mb-6 overflow-hidden"
                style={{ backgroundColor: ERROR_BG_LIGHT }}
                android_ripple={{ color: RIPPLE_COLOR, borderless: false }}
                accessibilityRole="button"
                accessibilityLabel="Delete transaction"
            >
                {({ pressed }) => (
                    <>
                        <View className="w-9 h-9 rounded-2xl items-center justify-center">
                            <Ionicons name="trash-outline" size={18} color={ERROR_COLOR} />
                        </View>
                        <ThemedText type="small" className="font-semibold flex-1 text-expense">
                            Delete Transaction
                        </ThemedText>
                        <Ionicons name="chevron-forward" size={16} color={ERROR_COLOR} />
                        {pressed && Platform.OS === 'ios' && (
                            <View style={[StyleSheet.absoluteFillObject, styles.pressedOverlay]} />
                        )}
                    </>
                )}
            </Pressable>

            {/* Cancel */}
            <Pressable
                onPress={() => handleClose()}
                className="py-4 rounded-2xl items-center bg-backgroundAlt dark:bg-dark-backgroundAlt overflow-hidden"
                android_ripple={{ color: RIPPLE_COLOR, borderless: false }}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
            >
                {({ pressed }) => (
                    <>
                        <ThemedText type="small" className="font-semibold text-textPrimary dark:text-dark-textPrimary">
                            Cancel
                        </ThemedText>
                        {pressed && Platform.OS === 'ios' && (
                            <View style={[StyleSheet.absoluteFillObject, styles.pressedOverlay]} />
                        )}
                    </>
                )}
            </Pressable>
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    pressedOverlay: {
        backgroundColor: RIPPLE_COLOR,
    },
});
