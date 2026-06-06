import { AppCard, ThemedText } from '@/components/common';
import type { Category } from '@/features/categories/hooks/use-categories';
import { UserService } from '@/features/user/services/user-service';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { shadows } from '@/theme/shadows';
import { typography } from '@/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import type { TimeFilter } from './utils';

interface ActivityHeaderProps {
    insets: { top: number };
    searchQuery: string;
    onSearchChange: (q: string) => void;
    activeTimeFilter: TimeFilter | null;
    onTimeFilterChange: (f: TimeFilter) => void;
    selectedCategoryId: number | null;
    onCategoryChange: (id: number | null) => void;
    onFilterPress: () => void;
    categories: Category[];
    income: number;
    expense: number;
    currency: string;
}

export function ActivityHeader({
    insets,
    searchQuery,
    onSearchChange,
    activeTimeFilter,
    onTimeFilterChange,
    selectedCategoryId,
    onCategoryChange,
    onFilterPress,
    categories,
    income,
    expense,
    currency,
}: ActivityHeaderProps) {
    const colors = useThemeColors();
    const colorScheme = useColorScheme();
    const [searchFocused, setSearchFocused] = useState(false);

    const headerGradient = colorScheme === 'dark'
        ? [`${colors.primary}24`, `${colors.primary}0F`, 'transparent'] as const
        : [`${colors.primary}12`, `${colors.primary}05`, 'transparent'] as const;

    return (
        <View className="bg-background dark:bg-dark-background">
            {/* Title row + gradient */}
            <View
                style={{ paddingTop: insets.top }}
                className="px-5 pt-5 pb-4 overflow-hidden"
            >
                <LinearGradient
                    colors={headerGradient}
                    className="absolute top-0 left-0 right-0 bottom-0"
                />

                <View className="flex-row items-center justify-between mb-1">
                    <ThemedText
                        className="font-semibold tracking-tight flex-1 mr-3"
                        style={{ fontSize: typography.fontSizes['2xl'] }}
                        numberOfLines={1}
                    >
                        Transaction History
                    </ThemedText>

                    {/* M3 icon button: 24dp icon per spec */}
                    <Pressable
                        onPress={onFilterPress}
                        accessibilityLabel="Open filters"
                        accessibilityRole="button"
                        className="w-10 h-10 rounded-2xl bg-primary items-center justify-center"
                        style={({ pressed }) => [
                            { ...shadows.md, shadowColor: colors.primary, shadowOpacity: 0.35 },
                            pressed && { opacity: 0.7 },
                        ]}
                    >
                        <Ionicons name="options-outline" size={24} color={colors.white} />
                    </Pressable>
                </View>
                <ThemedText
                    className="text-sm mb-4"
                    style={{ color: colors.textMuted }}
                >
                    Your complete financial record
                </ThemedText>

                {/*
                  M3 Search bar:
                  - cornerFull (28dp+) → rounded-full
                  - filled surfaceContainerHighest → bg-backgroundAlt (no border)
                  - bodyLarge (16sp) input text
                  - 56dp height
                  - shadow elevates on focus instead of border change
                */}
                <View className="relative mb-4">
                    <View className="absolute left-4 top-0 bottom-0 justify-center z-10">
                        <Ionicons
                            name="search"
                            size={20}
                            color={searchFocused ? colors.primary : colors.textMuted}
                        />
                    </View>
                    <TextInput
                        value={searchQuery}
                        onChangeText={onSearchChange}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        placeholder="Search transactions..."
                        placeholderTextColor={colors.inputPlaceholder}
                        accessibilityLabel="Search transactions"
                        accessibilityRole="search"
                        style={searchFocused
                            ? { ...shadows.sm, shadowColor: colors.black, fontFamily: 'PlusJakartaSans_400Regular' }
                            : { fontFamily: 'PlusJakartaSans_400Regular' }}
                        className="h-14 w-full bg-backgroundAlt dark:bg-dark-backgroundAlt rounded-full pl-12 pr-5 text-base text-textPrimary dark:text-dark-textPrimary"
                    />
                </View>

                {/*
                  M3 Filter chips:
                  - cornerSmall (8dp) → rounded-lg
                  - selected = primaryContainer bg (tinted, not solid primary) + primary label + checkmark
                  - unselected = surface + outline border + onSurfaceVariant label
                  - labelLarge (14sp, medium weight)
                */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-1">
                    <View className="flex-row gap-2 items-center">
                        {(['Month', 'Day', 'Week', 'Custom'] as TimeFilter[]).map((f) => {
                            const isActive = activeTimeFilter === f;
                            return (
                                <Pressable
                                    key={f}
                                    onPress={() => {
                                        if (f === 'Custom') onFilterPress();
                                        onTimeFilterChange(f);
                                    }}
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
                                    {/* M3: leading checkmark when selected */}
                                    {isActive && (
                                        <Ionicons name="checkmark" size={14} color={colors.primary} />
                                    )}
                                    <ThemedText
                                        className="text-sm font-medium"
                                        style={{ color: isActive ? colors.primary : colors.textMuted }}
                                    >
                                        {f}
                                    </ThemedText>
                                </Pressable>
                            );
                        })}

                        {categories.length > 0 && (
                            <View className="w-px h-5 bg-divider dark:bg-dark-divider mx-1" />
                        )}

                        {categories.slice(0, 3).map(cat => {
                            const isSelected = selectedCategoryId === cat.id;
                            return (
                                <Pressable
                                    key={cat.id}
                                    onPress={() => onCategoryChange(isSelected ? null : cat.id)}
                                    style={({ pressed }) => [
                                        isSelected
                                            ? {
                                                backgroundColor: `${colors.primary}1A`,
                                                borderWidth: 1,
                                                borderColor: `${colors.primary}40`,
                                            }
                                            : undefined,
                                        pressed && { opacity: 0.7 },
                                    ]}
                                    className={`px-4 py-2 rounded-lg flex-row items-center gap-1.5 ${!isSelected
                                        ? 'bg-surface dark:bg-dark-surface border border-borderSoft dark:border-dark-borderSoft'
                                        : ''
                                    }`}
                                >
                                    {isSelected && (
                                        <Ionicons name="checkmark" size={14} color={colors.primary} />
                                    )}
                                    <ThemedText
                                        className="text-sm font-medium"
                                        style={{ color: isSelected ? colors.primary : colors.textMuted }}
                                    >
                                        {cat.name}
                                    </ThemedText>
                                </Pressable>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>

            {/* Summary card */}
            <View className="px-5 pb-4">
                <AppCard className="p-5 mb-0" circleSize={100} circleOffset={28}>

                    <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-4">
                        {activeTimeFilter ?? 'All time'} Summary
                    </ThemedText>

                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-1">
                            <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-1">
                                Income
                            </ThemedText>
                            <ThemedText className="text-2xl font-bold" style={{ color: '#10B981', fontFamily: 'SpaceGrotesk_700Bold' }} numberOfLines={1} adjustsFontSizeToFit>
                                {UserService.formatCurrency(income, currency)}
                            </ThemedText>
                        </View>
                        <View className="w-px h-10 bg-divider dark:bg-dark-divider mx-4" />
                        <View className="flex-1 items-end">
                            <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-1">
                                Expenses
                            </ThemedText>
                            <ThemedText className="text-2xl font-bold" style={{ color: '#EF4444', fontFamily: 'SpaceGrotesk_700Bold' }} numberOfLines={1} adjustsFontSizeToFit>
                                {UserService.formatCurrency(expense, currency)}
                            </ThemedText>
                        </View>
                    </View>

                    <View className="h-2.5 bg-borderStrong dark:bg-dark-borderStrong rounded-full overflow-hidden mb-1.5">
                        <View
                            style={{
                                width: `${Math.min(income > 0 ? (expense / income) * 100 : 0, 100)}%`,
                                backgroundColor: expense > income ? '#EF4444' : '#10B981',
                            }}
                            className="h-full rounded-full"
                        />
                    </View>

                    <View className="flex-row justify-between items-center">
                        <ThemedText className="text-xs font-semibold" style={{ color: colors.textMuted }}>
                            {income > 0 ? `${Math.round(Math.min((expense / income) * 100, 100))}% of income spent` : 'No income recorded'}
                        </ThemedText>
                        {income - expense !== 0 && (
                            <View className="flex-row items-center gap-1">
                                <Ionicons
                                    name={income - expense >= 0 ? 'trending-up' : 'trending-down'}
                                    size={12}
                                    color={income - expense >= 0 ? '#10B981' : '#EF4444'}
                                />
                                <ThemedText
                                    className="text-xs font-bold"
                                    style={{ color: income - expense >= 0 ? '#10B981' : '#EF4444', fontFamily: 'SpaceGrotesk_700Bold' }}
                                >
                                    {income - expense >= 0 ? '+' : ''}{UserService.formatCurrency(income - expense, currency)}
                                </ThemedText>
                            </View>
                        )}
                    </View>
                </AppCard>
            </View>
        </View>
    );
}
