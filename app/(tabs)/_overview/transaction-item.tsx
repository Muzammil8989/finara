/**
 * TransactionItem — animated M3 card-style list item for a single transaction.
 *
 * ─── M3 List Item anatomy ────────────────────────────────────────────────────
 *   Leading  → icon badge  40×40dp / category color
 *   Headline → category    Body Large  16sp / Medium 500 (finance: 500 over Regular 400)
 *   Support  → note        Body Medium 14sp / Regular 400 / omitted when empty
 *   Trailing → amount      Body Large  16sp / Bold 700    (finance exception)
 *              date        Label Small 12sp / Medium 500
 *
 * ─── M3 card (Outlined Card) ─────────────────────────────────────────────────
 *   Surface  → surface / dark-surface
 *   Border   → borderSoft / dark-borderSoft (outline-variant, 1dp)
 *   Shadow   → none (Outlined Card = no elevation)
 *   Shape    → Shape.Large = 16dp → rounded-2xl
 *
 * ─── M3 color roles ──────────────────────────────────────────────────────────
 *   item surface   → surface / dark-surface        (on-surface container)
 *   item outline   → borderSoft / dark-borderSoft  (outline-variant)
 *   headline       → textPrimary / dark-textPrimary (on-surface)
 *   supporting     → textMuted / dark-textMuted     (on-surface-variant)
 *   income amount  → income  (#10B981) — theme-stable constant
 *   expense amount → expense (#EF4444) — theme-stable constant
 *   icon badge bg  → categoryColor at 12% opacity   (M3 tonal surface pattern)
 *   icon color     → categoryColor (or income/expense fallback)
 *
 * ─── M3 State Layer ──────────────────────────────────────────────────────────
 *   Pressed: primary at 12% opacity → rgba(36,107,253,0.12)
 *   Applied on ALL platforms:
 *     Android → android_ripple
 *     iOS     → absolute overlay View shown when Pressable is pressed
 */

import { ThemedText } from '@/components/common';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { UserService } from '@/features/user/services/user-service';
import type { Transaction } from '@/features/transactions/hooks/use-transactions';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

// ─── Constants ────────────────────────────────────────────────────────────────
// Identical in light and dark themes — no hook needed.

const INCOME_COLOR = '#10B981';   // theme.status.success
const EXPENSE_COLOR = '#EF4444';  // theme.status.error

// M3 primary at 12% opacity — pressed State Layer (M3 spec, all platforms)
const STATE_LAYER_COLOR = 'rgba(36,107,253,0.12)';

// Blue diagonal gradient — matches Activity screen transaction-row convention
const PRIMARY_COLOR = '#246BFD';
const CARD_GRADIENT_DARK  = [`${PRIMARY_COLOR}28`, `${PRIMARY_COLOR}10`, 'transparent'] as const;
const CARD_GRADIENT_LIGHT = [`${PRIMARY_COLOR}18`, `${PRIMARY_COLOR}06`, 'transparent'] as const;
const CIRCLE_COLOR_DARK   = `${PRIMARY_COLOR}14`;
const CIRCLE_COLOR_LIGHT  = `${PRIMARY_COLOR}0A`;

// Static config — text-income / text-expense are tailwind tokens; no dynamic class building
const AMOUNT_TEXT = {
    income:  'text-base font-bold text-income',
    expense: 'text-base font-bold text-expense',
} as const;

const FALLBACK_ICON: Record<'income' | 'expense', IoniconsName> = {
    income: 'arrow-down-circle-outline',
    expense: 'arrow-up-circle-outline',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTxDate(dateStr: string | null): string | null {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TransactionItemProps {
    tx: Transaction;
    index: number;
    currency: string;
    onPress?: () => void;
    style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const TransactionItem = React.memo(function TransactionItem({
    tx,
    index,
    currency,
    onPress,
    style,
}: TransactionItemProps) {
    const isIncome = tx.type === 'income';
    const isDark = useColorScheme() === 'dark';

    // Memoize — avoids creating a new animation config object on every render
    const entering = useMemo(
        () => FadeInDown.delay(index * 50).duration(400),
        [index],
    );

    // Prefer category-specific color; fall back to semantic income/expense constant
    const iconColor = tx.categoryColor ?? (isIncome ? INCOME_COLOR : EXPENSE_COLOR);

    // Prefer category-specific icon; fall back to direction arrow
    const iconName = (tx.categoryIcon as IoniconsName) ?? FALLBACK_ICON[tx.type];

    const formattedDate = formatTxDate(tx.date);
    const formattedAmount = UserService.formatCurrency(tx.amount, currency);

    const accessibilityLabel = [
        isIncome ? 'Income' : 'Expense',
        formattedAmount,
        tx.category,
        tx.note ?? null,
        formattedDate ?? null,
    ]
        .filter(Boolean)
        .join(', ');

    return (
        <Animated.View
            entering={entering}
            layout={LinearTransition}
            style={style}
        >
            <Pressable
                onPress={onPress}
                disabled={!onPress}
                accessible
                accessibilityLabel={accessibilityLabel}
                accessibilityRole={onPress ? 'button' : undefined}
                className="flex-row items-center bg-backgroundAlt dark:bg-dark-backgroundAlt p-4 rounded-2xl mb-3 overflow-hidden"
                android_ripple={onPress ? { color: STATE_LAYER_COLOR, borderless: false } : undefined}
            >
                {({ pressed }: { pressed: boolean }) => (
                    <>
                        <LinearGradient
                            colors={isDark ? CARD_GRADIENT_DARK : CARD_GRADIENT_LIGHT}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                            pointerEvents="none"
                        />
                        <View
                            style={[styles.decorativeCircle, { backgroundColor: isDark ? CIRCLE_COLOR_DARK : CIRCLE_COLOR_LIGHT }]}
                            pointerEvents="none"
                        />

                        {pressed && onPress && Platform.OS === 'ios' && (
                            <View
                                style={[StyleSheet.absoluteFillObject, styles.pressedOverlay]}
                                pointerEvents="none"
                            />
                        )}

                        <View
                            className="items-center justify-center mr-3 shrink-0"
                            style={{ width: 40, height: 40 }}
                            accessibilityElementsHidden
                        >
                            <Ionicons name={iconName} size={24} color={iconColor} />
                        </View>

                        <View className="flex-1">
                            <ThemedText
                                className="text-base font-medium text-textPrimary dark:text-dark-textPrimary"
                                numberOfLines={1}
                            >
                                {tx.category}
                            </ThemedText>

                            {tx.note ? (
                                <ThemedText
                                    className="text-sm text-textMuted dark:text-dark-textMuted mt-0.5"
                                    numberOfLines={1}
                                >
                                    {tx.note}
                                </ThemedText>
                            ) : null}
                        </View>

                        <View className="items-end ml-4">
                            <ThemedText
                                className={AMOUNT_TEXT[isIncome ? 'income' : 'expense']}
                                style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                accessibilityElementsHidden
                            >
                                {isIncome ? '+' : '-'}{formattedAmount}
                            </ThemedText>

                            {formattedDate && (
                                <ThemedText
                                    className="text-xs font-medium text-textMuted dark:text-dark-textMuted mt-0.5"
                                    accessibilityElementsHidden
                                >
                                    {formattedDate}
                                </ThemedText>
                            )}
                        </View>
                    </>
                )}
            </Pressable>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    pressedOverlay: {
        backgroundColor: STATE_LAYER_COLOR,
    },
    decorativeCircle: {
        position: 'absolute',
        top: -18,
        right: -18,
        width: 64,
        height: 64,
        borderRadius: 32,
    },
});
