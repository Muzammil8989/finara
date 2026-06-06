import { ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { typography } from '@/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { PeriodFilter, PERIOD_OPTIONS } from './utils';

interface ReportsHeaderProps {
    insets: EdgeInsets;
    period: PeriodFilter;
    onPeriodChange: (period: PeriodFilter) => void;
}

export function ReportsHeader({ insets, period, onPeriodChange }: ReportsHeaderProps) {
    const colors = useThemeColors();
    const colorScheme = useColorScheme();

    const headerGradient = colorScheme === 'dark'
        ? [`${colors.primary}24`, `${colors.primary}0F`, 'transparent'] as const
        : [`${colors.primary}12`, `${colors.primary}05`, 'transparent'] as const;

    return (
        <View className="bg-background dark:bg-dark-background">
            <View style={{ paddingTop: insets.top }} className="px-5 pt-5 pb-4 overflow-hidden">
                <LinearGradient
                    colors={headerGradient}
                    className="absolute top-0 left-0 right-0 bottom-0"
                />

                {/*
                  M3 Top App Bar title = headlineSmall (24sp, medium weight).
                  inline fontSize bypasses ThemedText typeClasses ordering issue.
                */}
                <ThemedText
                    className="font-semibold tracking-tight mb-1"
                    style={{ fontSize: typography.fontSizes['2xl'] }}
                >
                    Financial Insights
                </ThemedText>
                <ThemedText
                    className="text-sm mb-4"
                    style={{ color: colors.textMuted }}
                >
                    Deep analysis of your wealth
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
                        {PERIOD_OPTIONS.map(opt => {
                            const isActive = period === opt.key;
                            return (
                                <Pressable
                                    key={opt.key}
                                    onPress={() => onPeriodChange(opt.key)}
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
                                        {opt.label}
                                    </ThemedText>
                                </Pressable>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}
