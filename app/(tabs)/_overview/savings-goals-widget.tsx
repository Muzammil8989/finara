/**
 * SavingsGoalsWidget — overview card listing the user's top savings goals.
 *
 * ─── M3 card type ────────────────────────────────────────────────────────────
 *   Elevated Card:
 *     surface   → surfaceAlt / dark-surfaceAlt  (Level 1 tonal overlay, +5% primary)
 *     elevation → shadows.sm (Level 1, 1dp)
 *     border    → none  (Elevated Cards have NO border — border = Outlined Card)
 *     shape     → Shape.Large = 16dp → rounded-2xl
 *                 NOT rounded-3xl (24dp = Shape.Extra Large)
 *
 * ─── M3 color roles ──────────────────────────────────────────────────────────
 *   surface container  → surfaceAlt / dark-surfaceAlt   (M3 surface + tonal)
 *   section label      → on-surface-variant → textMuted
 *   goal name          → on-surface         → textPrimary
 *   progress track     → outline-variant    → borderStrong / dark-borderStrong
 *   progress fill      → goal color (custom) or success token (completed)
 *   divider            → divider / dark-divider
 *   checkmark icon     → success (#10B981)  — theme-stable constant
 *
 * ─── M3 type scale ───────────────────────────────────────────────────────────
 *   section label → Label Medium  12sp / Medium 500 / ls 0.5px
 *   goal name     → Body Medium   14sp / Medium 500
 *                   (finance exception: font-medium over Regular 400 for legibility)
 *   percentage    → Label Medium  12sp / Medium 500
 *   amounts       → Label Small   12sp / Regular 400 / on-surface-variant
 *
 * ─── M3 Linear Progress Indicator ────────────────────────────────────────────
 *   Height:  4dp → h-1  (NOT h-1.5 = 6dp which exceeds spec)
 *   Track:   secondaryContainer → borderStrong / dark-borderStrong
 *   Fill:    goal color or success (completed)
 *   Ends:    rounded-full (capsule)
 *
 * ─── M3 List Item ────────────────────────────────────────────────────────────
 *   2-line item total height: 72dp
 *   Leading icon container:  40×40dp  (NOT 36×36 which is below M3 standard)
 *   Row padding:             py-4 (16dp) + 40dp icon = 72dp ✓
 */

import { ThemedText } from '@/components/common';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { UserService } from '@/features/user/services/user-service';
import { shadows } from '@/theme/shadows';
import type { SavingsGoal } from '@/lib/db/schema';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, ViewStyle } from 'react-native';

// ─── Theme-stable constants ───────────────────────────────────────────────────
// Identical in light and dark themes — useThemeColors hook not needed.

const PRIMARY_COLOR = '#246BFD';  // theme.brand.primary
const SUCCESS_COLOR = '#10B981';  // theme.status.success

// Blue diagonal gradient — standard card convention
const CARD_GRADIENT_DARK  = [`${PRIMARY_COLOR}30`, `${PRIMARY_COLOR}12`, 'transparent'] as const;
const CARD_GRADIENT_LIGHT = [`${PRIMARY_COLOR}1C`, `${PRIMARY_COLOR}08`, 'transparent'] as const;
const CIRCLE_COLOR_DARK   = `${PRIMARY_COLOR}1A`;
const CIRCLE_COLOR_LIGHT  = `${PRIMARY_COLOR}0E`;

// ─── Props ────────────────────────────────────────────────────────────────────

interface SavingsGoalsWidgetProps {
    goals: SavingsGoal[];
    currency: string;
    /** Section heading. @default "Savings Goals" */
    title?: string;
    /** Maximum number of goals shown before the overflow label. @default 3 */
    maxVisible?: number;
    style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SavingsGoalsWidget({
    goals,
    currency,
    title = 'Savings Goals',
    maxVisible = 3,
    style,
}: SavingsGoalsWidgetProps) {
    const isDark = useColorScheme() === 'dark';

    if (goals.length === 0) return null;

    const visibleGoals = goals.slice(0, maxVisible);
    const overflow = goals.length - maxVisible;

    return (
        <View className="px-6 mb-8" style={style}>
            {/* M3 Label Medium — section heading, on-surface-variant */}
            <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-3">
                {title}
            </ThemedText>

            {/*
              M3 Elevated Card
              - surfaceAlt approximates Level 1 primary tonal overlay (+5%)
              - shadows.sm = Level 1 elevation (1dp)
              - NO border (border = Outlined Card, not Elevated)
              - rounded-2xl = Shape.Large (16dp), NOT rounded-3xl (24dp = Extra Large)
            */}
            <View
                className="bg-surfaceAlt dark:bg-dark-surfaceAlt rounded-2xl overflow-hidden"
                style={shadows.sm}
            >
                <LinearGradient
                    colors={isDark ? CARD_GRADIENT_DARK : CARD_GRADIENT_LIGHT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    pointerEvents="none"
                />
                <View
                    style={{
                        position: 'absolute',
                        top: -28,
                        right: -28,
                        width: 100,
                        height: 100,
                        borderRadius: 50,
                        backgroundColor: isDark ? CIRCLE_COLOR_DARK : CIRCLE_COLOR_LIGHT,
                    }}
                    pointerEvents="none"
                />

                {visibleGoals.map((goal, i) => (
                    <GoalRow
                        key={goal.id}
                        goal={goal}
                        currency={currency}
                        showDivider={i > 0}
                    />
                ))}

                {/* M3 Label Medium — overflow footer */}
                {overflow > 0 && (
                    <View className="border-t border-divider dark:border-dark-divider px-4 py-2.5 items-center">
                        <ThemedText className="text-xs font-medium text-textMuted dark:text-dark-textMuted">
                            +{overflow} more {overflow === 1 ? 'goal' : 'goals'}
                        </ThemedText>
                    </View>
                )}
            </View>
        </View>
    );
}

// ─── GoalRow ─────────────────────────────────────────────────────────────────

interface GoalRowProps {
    goal: SavingsGoal;
    currency: string;
    showDivider: boolean;
}

function GoalRow({ goal, currency, showDivider }: GoalRowProps) {
    const pct = goal.target_amount > 0
        ? Math.min((goal.saved_amount / goal.target_amount) * 100, 100)
        : 0;

    const goalColor = goal.color ?? PRIMARY_COLOR;
    const isCompleted = goal.is_completed === 1 || pct >= 100;
    const fillColor = isCompleted ? SUCCESS_COLOR : goalColor;

    return (
        <View
            accessible
            accessibilityLabel={`${goal.name}, ${isCompleted ? 'completed' : `${Math.round(pct)}% saved`}`}
        >
            {/* M3 inset divider — outline-variant color, middle-inset */}
            {showDivider && (
                <View className="h-px bg-divider dark:bg-dark-divider mx-4" />
            )}

            {/*
              M3 2-line List Item = 72dp total height
              py-4 (16dp × 2) + 40dp icon = 72dp ✓
            */}
            <View className="px-4 py-4 flex-row items-center gap-3">
                {/*
                  M3 Leading icon container — 40×40dp
                  Shape: borderRadius 12 → Shape.Medium (12dp on 40dp = 30%)
                */}
                <View
                    className="items-center justify-center shrink-0"
                    style={{ width: 40, height: 40 }}
                    accessibilityElementsHidden
                >
                    <Ionicons
                        name={(goal.icon as IoniconsName) ?? 'wallet-outline'}
                        size={24}
                        color={goalColor}
                    />
                </View>

                {/* List item content */}
                <View className="flex-1">
                    {/* Headline row + trailing indicator */}
                    <View className="flex-row justify-between items-center mb-1.5">
                        {/*
                          M3 List Headline — Body Medium
                          14sp / font-medium (500)
                          Goal name uses font-medium over M3 Regular 400 for legibility
                        */}
                        <ThemedText
                            className="text-sm font-medium text-textPrimary dark:text-dark-textPrimary flex-1"
                            numberOfLines={1}
                        >
                            {goal.name}
                        </ThemedText>

                        {/*
                          M3 Label Medium — 12sp / Medium 500
                          Percentage: font-medium (500) NOT font-bold (700)
                          Checkmark: Ionicons in View (never inside ThemedText)
                        */}
                        <View className="ml-2 flex-row items-center" accessibilityElementsHidden>
                            {isCompleted ? (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={16}
                                    color={SUCCESS_COLOR}
                                />
                            ) : (
                                <ThemedText
                                    className="text-xs font-medium"
                                    style={{ color: goalColor }}
                                >
                                    {Math.round(pct)}%
                                </ThemedText>
                            )}
                        </View>
                    </View>

                    {/*
                      M3 Linear Progress Indicator
                      Height: h-1 = 4dp  (spec is exactly 4dp — was h-1.5 = 6dp)
                      Track:  borderStrong / dark-borderStrong = outline-variant role
                      Fill:   goal color or success (completed)
                      Ends:   rounded-full (M3 capsule terminus)
                    */}
                    <View className="h-1 rounded-full overflow-hidden bg-borderStrong dark:bg-dark-borderStrong">
                        <View
                            style={{
                                width: `${pct}%`,
                                height: '100%',
                                backgroundColor: fillColor,
                                borderRadius: 9999,
                            }}
                        />
                    </View>

                    <View className="flex-row justify-between mt-1.5">
                        <ThemedText
                            className="text-xs text-textMuted dark:text-dark-textMuted flex-1 mr-2"
                            numberOfLines={1}
                            style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }}
                        >
                            {UserService.formatCurrency(goal.saved_amount, currency)}
                        </ThemedText>
                        <ThemedText
                            className="text-xs text-textMuted dark:text-dark-textMuted flex-shrink-0"
                            numberOfLines={1}
                            style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }}
                        >
                            {UserService.formatCurrency(goal.target_amount, currency)}
                        </ThemedText>
                    </View>
                </View>
            </View>
        </View>
    );
}
