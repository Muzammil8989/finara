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
import { SavingsFilter, SAVINGS_FILTER_OPTIONS } from './utils';

interface SavingsHeaderProps {
    insets: { top: number };
    showSummary: boolean;
    totalSaved: number;
    totalTarget: number;
    overallPct: number;
    completedCount: number;
    currency: string;
    activeFilter: SavingsFilter;
    onFilterChange: (f: SavingsFilter) => void;
    onAddPress: () => void;
}

export function SavingsHeader({
    insets,
    showSummary,
    totalSaved,
    totalTarget,
    overallPct,
    completedCount,
    currency,
    activeFilter,
    onFilterChange,
    onAddPress,
}: SavingsHeaderProps) {
    const colors = useThemeColors();
    const colorScheme = useColorScheme();

    const headerGradient = colorScheme === 'dark'
        ? [`${colors.success}29`, `${colors.primary}12`, 'transparent'] as const
        : [`${colors.success}17`, `${colors.primary}08`, 'transparent'] as const;

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
                        Savings Goals
                    </ThemedText>

                    {/* M3 icon button: 24dp icon per spec */}
                    <Pressable
                        onPress={onAddPress}
                        accessibilityLabel="Add savings goal"
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
                    Save for what matters most
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
                        {SAVINGS_FILTER_OPTIONS.map(({ value, label }) => {
                            const isActive = activeFilter === value;
                            return (
                                <Pressable
                                    key={value}
                                    onPress={() => onFilterChange(value)}
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
                            colors={colorScheme === 'dark' ? [`${colors.primary}30`, `${colors.primary}12`, 'transparent'] : [`${colors.primary}1C`, `${colors.primary}08`, 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                            pointerEvents="none"
                        />
                        <View
                            style={{
                                position: 'absolute', top: -28, right: -28,
                                width: 100, height: 100, borderRadius: 50,
                                backgroundColor: colorScheme === 'dark' ? `${colors.primary}1A` : `${colors.primary}0E`,
                            }}
                            pointerEvents="none"
                        />
                        <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-4">
                            Overall Progress
                        </ThemedText>

                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-1">
                                <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-1">
                                    Total Saved
                                </ThemedText>
                                <ThemedText className="text-2xl font-bold" style={{ color: colors.success, fontFamily: 'SpaceGrotesk_700Bold' }} numberOfLines={1} adjustsFontSizeToFit>
                                    {UserService.formatCurrency(totalSaved, currency)}
                                </ThemedText>
                            </View>
                            <View className="w-px h-10 bg-divider dark:bg-dark-divider mx-4" />
                            <View className="flex-1 items-end">
                                <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-1">
                                    Total Target
                                </ThemedText>
                                <ThemedText className="text-2xl font-bold text-textPrimary dark:text-dark-textPrimary" numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: 'SpaceGrotesk_700Bold' }}>
                                    {UserService.formatCurrency(totalTarget, currency)}
                                </ThemedText>
                            </View>
                        </View>

                        <View className="h-2.5 bg-borderStrong dark:bg-dark-borderStrong rounded-full overflow-hidden mb-1.5">
                            <View
                                style={{ width: `${Math.min(overallPct, 100)}%`, backgroundColor: colors.success }}
                                className="h-full rounded-full"
                            />
                        </View>

                        <View className="flex-row justify-between items-center">
                            <ThemedText
                                className="text-xs font-semibold"
                                style={{ color: colors.textMuted }}
                            >
                                {Math.round(overallPct)}% of total target reached
                            </ThemedText>
                            {completedCount > 0 && (
                                <View className="flex-row items-center gap-1">
                                    <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                                    <ThemedText className="text-xs font-bold" style={{ color: colors.success }}>
                                        {completedCount} completed
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
