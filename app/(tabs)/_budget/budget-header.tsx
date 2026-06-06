import { ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { UserService } from '@/features/user/services/user-service';
import { shadows } from '@/theme/shadows';
import { typography } from '@/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { PeriodFilter, getProgressColor } from './utils';

interface BudgetHeaderProps {
    insets: { top: number };
    periodFilter: PeriodFilter;
    onPeriodChange: (p: PeriodFilter) => void;
    totalSpent: number;
    totalBudgeted: number;
    overallPercent: number;
    currency: string;
    showSummary: boolean;
    onAddPress: () => void;
}

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
];

export function BudgetHeader({
    insets,
    periodFilter,
    onPeriodChange,
    totalSpent,
    totalBudgeted,
    overallPercent,
    currency,
    showSummary,
    onAddPress,
}: BudgetHeaderProps) {
    const colors = useThemeColors();
    const colorScheme = useColorScheme();
    const overallColor = getProgressColor(overallPercent, colors);

    const headerGradient = colorScheme === 'dark'
        ? [`${colors.primary}24`, `${colors.primary}0F`, 'transparent'] as const
        : [`${colors.primary}12`, `${colors.primary}05`, 'transparent'] as const;
    const summaryGradient = colorScheme === 'dark'
        ? [`${colors.primary}30`, `${colors.primary}12`, 'transparent'] as const
        : [`${colors.primary}1C`, `${colors.primary}08`, 'transparent'] as const;

    return (
        <View className="bg-background dark:bg-dark-background">
            <View
                style={{ paddingTop: insets.top }}
                className="px-5 pt-5 pb-4 overflow-hidden"
            >
                <LinearGradient
                    colors={headerGradient}
                    className="absolute top-0 left-0 right-0 bottom-0"
                />

                <View className="flex-row items-center justify-between mb-1">
                    {/*
                      M3 Top App Bar title = headlineSmall (24sp, medium weight).
                      inline fontSize bypasses ThemedText typeClasses ordering issue.
                    */}
                    <ThemedText
                        className="font-semibold tracking-tight"
                        style={{ fontSize: typography.fontSizes['2xl'] }}
                    >
                        Smart Budgets
                    </ThemedText>

                    {/* M3 icon button: 24dp icon per spec */}
                    <Pressable
                        onPress={onAddPress}
                        accessibilityLabel="Add budget"
                        accessibilityRole="button"
                        className="w-10 h-10 rounded-2xl bg-primary items-center justify-center"
                        style={({ pressed }) => [
                            { ...shadows.md, shadowColor: colors.primary, shadowOpacity: 0.35 },
                            pressed && { opacity: 0.7 },
                        ]}
                    >
                        <Ionicons name="add" size={24} color={colors.white} />
                    </Pressable>
                </View>
                <ThemedText
                    className="text-sm mb-4"
                    style={{ color: colors.textMuted }}
                >
                    Track your spending limits
                </ThemedText>

                {/*
                  M3 Filter chips:
                  - cornerSmall (8dp) → rounded-lg
                  - selected = primaryContainer bg (tinted) + primary label + checkmark
                  - unselected = surface + outline border + onSurfaceVariant label
                  - labelLarge (14sp, medium weight)
                */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-1">
                    <View className="flex-row gap-2 items-center">
                        {PERIOD_OPTIONS.map(({ value, label }) => {
                            const isActive = periodFilter === value;
                            return (
                                <Pressable
                                    key={value}
                                    onPress={() => onPeriodChange(value)}
                                    style={({ pressed }) => [
                                        isActive
                                            ? {
                                                backgroundColor: `${colors.primary}1A`,
                                                borderWidth: 1,
                                                borderColor: `${colors.primary}40`,
                                            }
                                            : undefined,
                                        pressed && { opacity: 0.7 },
                                    ]}
                                    className={`px-4 py-2 rounded-lg flex-row items-center gap-1.5 ${!isActive
                                        ? 'bg-surface dark:bg-dark-surface border border-borderSoft dark:border-dark-borderSoft'
                                        : ''
                                    }`}
                                >
                                    {isActive && (
                                        <Ionicons name="checkmark" size={14} color={colors.primary} />
                                    )}
                                    <ThemedText
                                        className="text-sm font-medium"
                                        style={{ color: isActive ? colors.primary : colors.textMuted }}
                                    >
                                        {label}
                                    </ThemedText>
                                </Pressable>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>

            {/*
              M3 Filled card:
              - rounded-xl = 12dp (M3 card corner radius)
              - no border per M3 filled card spec
            */}
            {showSummary && (
                <View className="px-5 pb-4">
                    <View className="bg-backgroundAlt dark:bg-dark-backgroundAlt rounded-2xl p-5 overflow-hidden">
                        <LinearGradient
                            colors={summaryGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                            pointerEvents="none"
                        />
                        <View
                            style={{
                                position: 'absolute',
                                top: -28, right: -28,
                                width: 100, height: 100, borderRadius: 50,
                                backgroundColor: colorScheme === 'dark' ? `${colors.primary}1A` : `${colors.primary}0E`,
                            }}
                            pointerEvents="none"
                        />

                        <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-4">
                            Budget Summary
                        </ThemedText>

                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-1">
                                <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-1" numberOfLines={1}>
                                    Total Spent
                                </ThemedText>
                                <ThemedText
                                    className="text-2xl font-bold"
                                    style={{ color: overallColor, fontFamily: 'SpaceGrotesk_700Bold' }}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                >
                                    {UserService.formatCurrency(totalSpent, currency)}
                                </ThemedText>
                            </View>
                            <View className="w-px h-10 bg-divider dark:bg-dark-divider mx-4" />
                            <View className="flex-1 items-end">
                                <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-1" numberOfLines={1}>
                                    Total Budget
                                </ThemedText>
                                <ThemedText
                                    className="text-2xl font-bold text-textPrimary dark:text-dark-textPrimary"
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
                                >
                                    {UserService.formatCurrency(totalBudgeted, currency)}
                                </ThemedText>
                            </View>
                        </View>

                        <View className="h-2.5 bg-borderStrong dark:bg-dark-borderStrong rounded-full overflow-hidden mb-1.5">
                            <View
                                style={{ width: `${Math.min(overallPercent, 100)}%`, backgroundColor: overallColor }}
                                className="h-full rounded-full"
                            />
                        </View>

                        <View className="flex-row justify-between items-center">
                            <ThemedText className="text-xs font-semibold" style={{ color: colors.textMuted, fontFamily: 'SpaceGrotesk_600SemiBold' }}>
                                {Math.round(overallPercent)}% of total budget used
                            </ThemedText>
                            {totalBudgeted - totalSpent !== 0 && (
                                <View className="flex-row items-center gap-1">
                                    <Ionicons
                                        name={totalSpent <= totalBudgeted ? 'checkmark-circle' : 'warning'}
                                        size={12}
                                        color={overallColor}
                                    />
                                    <ThemedText className="text-xs font-bold" style={{ color: overallColor, fontFamily: 'SpaceGrotesk_700Bold' }}>
                                        {totalSpent <= totalBudgeted
                                            ? `${UserService.formatCurrency(totalBudgeted - totalSpent, currency)} left`
                                            : `${UserService.formatCurrency(totalSpent - totalBudgeted, currency)} over`}
                                    </ThemedText>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}
