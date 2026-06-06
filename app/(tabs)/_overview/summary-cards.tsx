/**
 * SummaryCards — side-by-side income and expense totals for the overview.
 *
 * ─── M3 card type ────────────────────────────────────────────────────────────
 *   Filled Card:
 *     surface  → successBg / errorBg (M3 secondary-container / error-container)
 *     border   → none  (Filled Cards have NO border — border = Outlined Card)
 *     shadow   → none  (Filled Cards have no elevation)
 *     shape    → Shape.Large = 16dp → rounded-2xl
 *                NOT rounded-3xl (24dp = Shape.Extra Large)
 *     padding  → 16dp → p-4  (M3 card padding spec = 16dp, NOT 20dp)
 *
 * ─── M3 color roles ──────────────────────────────────────────────────────────
 *   income container  → successBg / dark-successBg   (M3 secondary-container)
 *   income text       → successText / dark-successText (M3 on-secondary-container)
 *   income badge      → income (#10B981)
 *   expense container → errorBg / dark-errorBg        (M3 error-container)
 *   expense text      → errorText / dark-errorText     (M3 on-error-container)
 *   expense badge     → expense (#EF4444)
 *
 *   M3 rule: ALL text on a container must use the on-container color.
 *   Using textPrimary (on-surface) inside successBg (secondary-container) breaks
 *   the M3 container / on-container color role pairing — fixed here.
 *
 * ─── M3 type scale ───────────────────────────────────────────────────────────
 *   label  → Label Medium  12sp / Medium 500 / ls 0.5px
 *            (uppercase is a design embellishment, not M3 spec)
 *   amount → Title Large   22sp / Regular 400
 *            (finance exception: font-semibold kept for emphasis)
 *
 * ─── NativeWind static class rule ────────────────────────────────────────────
 *   All per-type class strings live in CARD_CONFIG — never build them
 *   dynamically (e.g. `bg-${type}Bg`); the compiler won't include them.
 */

import { ThemedText } from '@/components/common';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { UserService } from '@/features/user/services/user-service';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, ViewStyle } from 'react-native';

// ─── Per-type static token config ─────────────────────────────────────────────

interface CardConfig {
    /** M3 Filled Card container color — secondary-container / error-container */
    containerClass: string;
    /** M3 on-container text color — used for BOTH label AND amount */
    textClass: string;
    /** Icon badge background color */
    badgeClass: string;
    /** Ionicons icon name — filled circle variant for visual weight on the badge */
    icon: IoniconsName;
    defaultLabel: string;
    accessibilityHint: string;
    /** Decorative circle accent color — dark / light theme */
    circleDark: string;
    circleLight: string;
}

const CARD_CONFIG = {
    income: {
        containerClass: 'bg-successBg dark:bg-dark-successBg',
        textClass: 'text-successText dark:text-dark-successText',
        badgeClass: 'bg-income',
        icon: 'arrow-down-circle',
        defaultLabel: 'Income',
        accessibilityHint: 'total income this period',
        circleDark: '#10B98122',
        circleLight: '#10B9811A',
    },
    expense: {
        containerClass: 'bg-errorBg dark:bg-dark-errorBg',
        textClass: 'text-errorText dark:text-dark-errorText',
        badgeClass: 'bg-expense',
        icon: 'arrow-up-circle',
        defaultLabel: 'Expense',
        accessibilityHint: 'total expenses this period',
        circleDark: '#EF444422',
        circleLight: '#EF44441A',
    },
} satisfies Record<string, CardConfig>;

// ─── SummaryCards ─────────────────────────────────────────────────────────────

interface SummaryCardsProps {
    totalIncome: number;
    totalExpense: number;
    currency: string;
    style?: ViewStyle;
}

export function SummaryCards({
    totalIncome,
    totalExpense,
    currency,
    style,
}: SummaryCardsProps) {
    return (
        <View className="flex-row px-6 mb-8 gap-4" style={style}>
            <SummaryCard type="income" amount={totalIncome} currency={currency} />
            <SummaryCard type="expense" amount={totalExpense} currency={currency} />
        </View>
    );
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────

interface SummaryCardProps {
    type: keyof typeof CARD_CONFIG;
    amount: number;
    currency: string;
    /** Override the default label ("Income" / "Expense"). */
    label?: string;
}

function SummaryCard({ type, amount, currency, label }: SummaryCardProps) {
    const { containerClass, textClass, badgeClass, icon, defaultLabel, accessibilityHint, circleDark, circleLight } =
        CARD_CONFIG[type];
    const isDark = useColorScheme() === 'dark';

    const displayLabel = label ?? defaultLabel;
    const formattedAmount = UserService.formatCurrency(amount, currency);

    return (
        <View
            className={`flex-1 p-4 rounded-2xl overflow-hidden ${containerClass}`}
            accessible
            accessibilityLabel={`${formattedAmount} ${accessibilityHint}`}
        >
            {/* Decorative circle bleeding off bottom-right */}
            <View
                style={{
                    position: 'absolute',
                    bottom: -24,
                    right: -24,
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: isDark ? circleDark : circleLight,
                }}
                pointerEvents="none"
            />
            {/* Icon badge — saturated background, white icon for M3-compliant contrast */}
            <View
                className={`w-10 h-10 ${badgeClass} rounded-2xl items-center justify-center mb-3`}
                accessibilityElementsHidden
            >
                {/*
                 * Ionicons filled circle icons — replaces IconSymbol (SF Symbols)
                 * IconSymbol mapped arrow.down.right.circle.fill → MaterialIcons
                 * 'arrow-downward' (plain arrow, no circle). Ionicons gives us the
                 * proper filled circle variant consistently on all platforms.
                 */}
                <Ionicons name={icon} size={20} color="#FFFFFF" />
            </View>

            <ThemedText
                className={`text-xs font-medium uppercase ${textClass}`}
                numberOfLines={1}
                accessibilityElementsHidden
            >
                {displayLabel}
            </ThemedText>

            <ThemedText
                className={`text-xl font-semibold mt-1 ${textClass}`}
                style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }}
                numberOfLines={1}
                adjustsFontSizeToFit
                accessibilityElementsHidden
            >
                {formattedAmount}
            </ThemedText>
        </View>
    );
}
