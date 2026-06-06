/**
 * BalanceCard — displays the user's primary account balance.
 *
 * ─── M3 type scale ───────────────────────────────────────────────────────────
 *   label  → Label Medium   12sp / Medium 500 / ls 0.5px
 *   amount → Display Small  36sp / Regular 400 / lh 44sp
 *              ↳ finance exception: font-semibold (600) used instead of Regular
 *                because balance figures benefit from weight emphasis. This is
 *                a deliberate, documented deviation from M3 Display spec.
 *   trend  → Label Large    14sp / Medium 500 / ls 0.1px
 *
 * ─── M3 color roles ──────────────────────────────────────────────────────────
 *   label text     → on-surface-variant  → textMuted / dark-textMuted
 *   amount text    → on-surface          → textPrimary / dark-textPrimary
 *   trend positive → success  (#10B981)  — theme-stable constant
 *   trend negative → error    (#EF4444)  — theme-stable constant
 *
 * ─── M3 card variants ────────────────────────────────────────────────────────
 *   elevated  → surface + tonal overlay (surfaceAlt) + Level 1 shadow (1dp)
 *   filled    → surfaceContainerHighest (backgroundAlt) + no shadow + no border
 *   outlined  → surface + no shadow + 1dp outline-variant border
 *
 * ─── M3 shape ────────────────────────────────────────────────────────────────
 *   card variants use Shape.Large = 16dp → rounded-xl (borderRadius.xl = 16)
 *   NOT rounded-2xl (24dp) which is Shape.Extra Large
 */

import { ThemedText } from '@/components/common';
import { shadows } from '@/theme/shadows';
import { UserService } from '@/features/user/services/user-service';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, ViewStyle } from 'react-native';

// ─── Theme-stable semantic constants ─────────────────────────────────────────
// These are identical in light and dark themes — no hook needed.

const TREND_UP_COLOR = '#10B981';   // theme.status.success
const TREND_DOWN_COLOR = '#EF4444'; // theme.status.error

// ─── Types ────────────────────────────────────────────────────────────────────

interface Trend {
    /** Percentage change, e.g. 5.2 means +5.2 %, -3.1 means -3.1 % */
    value: number;
    /** Short context shown after the percentage, e.g. "vs last month" */
    period?: string;
}

interface BalanceCardProps {
    balance: number;
    currency: string;
    /**
     * Descriptive label rendered above the amount.
     * @default "Current Balance"
     */
    label?: string;
    /**
     * Optional trend badge shown below the amount.
     */
    trend?: Trend;
    /**
     * Visual variant — maps directly to M3 card types:
     *
     * - `default`   bare hero display, no container (for screen header areas)
     * - `compact`   reduced spacing + Title Large instead of Display Small
     * - `elevated`  M3 Elevated Card — surfaceAlt + Level 1 shadow (1dp)
     * - `filled`    M3 Filled Card   — backgroundAlt + no shadow/border
     * - `outlined`  M3 Outlined Card — surface + outline-variant border
     *
     * @default "default"
     */
    variant?: 'default' | 'compact' | 'elevated' | 'filled' | 'outlined';
    style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BalanceCard({
    balance,
    currency,
    label = 'Current Balance',
    trend,
    variant = 'default',
    style,
}: BalanceCardProps) {
    const formattedAmount = UserService.formatCurrency(balance, currency);
    const isPositiveTrend = trend !== undefined && trend.value >= 0;
    const trendColor = isPositiveTrend ? TREND_UP_COLOR : TREND_DOWN_COLOR;

    // ── compact — reduced spacing, Title Large scale ──────────────────────────
    if (variant === 'compact') {
        return (
            <View
                className="px-6"
                style={style}
                accessible
                accessibilityLabel={`${label}: ${formattedAmount}`}
            >
                <ThemedText className="text-xs font-medium uppercase text-textMuted dark:text-dark-textMuted mb-1">
                    {label}
                </ThemedText>
                <ThemedText
                    className="text-2xl font-semibold leading-tight text-textPrimary dark:text-dark-textPrimary"
                    style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                >
                    {formattedAmount}
                </ThemedText>
                {trend && (
                    <TrendBadge color={trendColor} value={trend.value} isPositive={isPositiveTrend} period={trend.period} />
                )}
            </View>
        );
    }

    // ── M3 Elevated Card ──────────────────────────────────────────────────────
    // surfaceAlt approximates M3 primary tonal overlay at Level 1 (+5% primary tint)
    // Shape.Large = 16dp → rounded-xl
    // Elevation Level 1 = 1dp → shadows.sm
    if (variant === 'elevated') {
        return (
            <View
                className="mx-6 mb-6 bg-surfaceAlt dark:bg-dark-surfaceAlt rounded-xl p-5"
                style={[shadows.sm, style]}
                accessible
                accessibilityLabel={`${label}: ${formattedAmount}`}
            >
                <BalanceContent label={label} formattedAmount={formattedAmount} trend={trend} trendColor={trendColor} isPositiveTrend={isPositiveTrend} />
            </View>
        );
    }

    // ── M3 Filled Card ────────────────────────────────────────────────────────
    // backgroundAlt maps to M3 surfaceContainerHighest — highest-tint surface
    // No shadow, no border. Shape.Large = 16dp → rounded-xl
    if (variant === 'filled') {
        return (
            <View
                className="mx-6 mb-6 bg-backgroundAlt dark:bg-dark-backgroundAlt rounded-xl p-5"
                style={style}
                accessible
                accessibilityLabel={`${label}: ${formattedAmount}`}
            >
                <BalanceContent label={label} formattedAmount={formattedAmount} trend={trend} trendColor={trendColor} isPositiveTrend={isPositiveTrend} />
            </View>
        );
    }

    // ── M3 Outlined Card ──────────────────────────────────────────────────────
    // surface bg + 1dp outline-variant border. No shadow. Shape.Large → rounded-xl
    if (variant === 'outlined') {
        return (
            <View
                className="mx-6 mb-6 bg-surface dark:bg-dark-surface rounded-xl p-5"
                style={style}
                accessible
                accessibilityLabel={`${label}: ${formattedAmount}`}
            >
                <BalanceContent label={label} formattedAmount={formattedAmount} trend={trend} trendColor={trendColor} isPositiveTrend={isPositiveTrend} />
            </View>
        );
    }

    // ── default — bare hero display, no card container ────────────────────────
    return (
        <View
            className="px-6 mb-6"
            style={style}
            accessible
            accessibilityLabel={`${label}: ${formattedAmount}`}
        >
            <BalanceContent label={label} formattedAmount={formattedAmount} trend={trend} trendColor={trendColor} isPositiveTrend={isPositiveTrend} />
        </View>
    );
}

// ─── BalanceContent ───────────────────────────────────────────────────────────

interface BalanceContentProps {
    label: string;
    formattedAmount: string;
    trend?: Trend;
    trendColor: string;
    isPositiveTrend: boolean;
}

function BalanceContent({ label, formattedAmount, trend, trendColor, isPositiveTrend }: BalanceContentProps) {
    return (
        <>
            {/* M3 Label Medium — 12sp / Medium 500 / ls 0.5px / on-surface-variant */}
            <ThemedText
                accessibilityElementsHidden
                className="text-xs font-medium uppercase text-textMuted dark:text-dark-textMuted mb-2"
            >
                {label}
            </ThemedText>

            <ThemedText
                accessibilityElementsHidden
                className="text-4xl font-semibold leading-tight text-textPrimary dark:text-dark-textPrimary"
                style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }}
                numberOfLines={1}
                adjustsFontSizeToFit
            >
                {formattedAmount}
            </ThemedText>

            {trend && (
                <TrendBadge
                    color={trendColor}
                    value={trend.value}
                    isPositive={isPositiveTrend}
                    period={trend.period}
                />
            )}
        </>
    );
}

// ─── TrendBadge ───────────────────────────────────────────────────────────────

interface TrendBadgeProps {
    color: string;
    value: number;
    isPositive: boolean;
    period?: string;
}

function TrendBadge({ color, value, isPositive, period }: TrendBadgeProps) {
    return (
        <View className="flex-row items-center mt-2 gap-1" accessibilityElementsHidden>
            {/* M3 Material Icon — replaces Unicode ↑↓ glyphs for consistent rendering */}
            <Ionicons
                name={isPositive ? 'trending-up' : 'trending-down'}
                size={14}
                color={color}
            />
            {/* M3 Label Large — 14sp / Medium 500 */}
            <ThemedText className="text-sm font-medium" style={{ color }}>
                {Math.abs(value).toFixed(1)}%
            </ThemedText>
            {period && (
                <ThemedText className="text-sm text-textMuted dark:text-dark-textMuted">
                    {period}
                </ThemedText>
            )}
        </View>
    );
}
