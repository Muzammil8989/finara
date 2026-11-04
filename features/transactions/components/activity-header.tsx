import { HeaderIconButton, Rule, ScreenHeader, SegmentedControl, ThemedText, type SegmentOption } from '@/components/common';
import type { Category } from '@/features/categories/hooks/use-categories';
import { UserService } from '@/features/user/services/user-service';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { fonts } from '@/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Pressable } from '@/components/common/pressable';
import type { TimeFilter } from '../utils';

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
    /** Number of transactions in view, shown in the kicker. */
    count?: number;
}

const TIME_SEGMENTS: readonly SegmentOption<TimeFilter>[] = [
    { key: 'Day', label: 'Today', accessibilityLabel: 'Today' },
    { key: 'Week', label: 'Week', accessibilityLabel: 'This week' },
    { key: 'Month', label: 'Month', accessibilityLabel: 'This month' },
    { key: 'Custom', label: 'Custom', accessibilityLabel: 'Custom date range' },
];

const KICKER: Record<TimeFilter, string> = {
    Day: 'Today',
    Week: 'This week',
    Month: 'This month',
    Custom: 'Custom range',
};

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
    count,
}: ActivityHeaderProps) {
    const colors = useThemeColors();
    const [searchFocused, setSearchFocused] = useState(false);
    const net = income - expense;
    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const scope = selectedCategory ? `${selectedCategory.name} · all time` : activeTimeFilter ? KICKER[activeTimeFilter] : 'All time';

    return (
        <View className="bg-background dark:bg-dark-background" style={{ paddingTop: insets.top }}>
            <ScreenHeader
                showBack={false}
                kicker={count != null ? `${scope} · ${count} ${count === 1 ? 'entry' : 'entries'}` : scope}
                title="Activity"
                right={<HeaderIconButton icon="calendar-outline" accessibilityLabel="Open filters" onPress={onFilterPress} />}
            />

            {/* Search */}
            <View className="px-5 mb-3">
                <View
                    className="flex-row items-center h-12 rounded-xl px-3.5 border"
                    style={{
                        backgroundColor: colors.surface,
                        borderColor: searchFocused ? colors.primary : colors.borderStrong,
                    }}
                >
                    <Ionicons name="search" size={18} color={searchFocused ? colors.primary : colors.textMuted} />
                    <TextInput
                        value={searchQuery}
                        onChangeText={onSearchChange}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        placeholder="Search notes and categories"
                        placeholderTextColor={colors.inputPlaceholder}
                        accessibilityLabel="Search transactions"
                        accessibilityRole="search"
                        returnKeyType="search"
                        className="flex-1 ml-2.5 text-[15px] text-textPrimary dark:text-dark-textPrimary"
                        style={{ fontFamily: fonts.sans, paddingVertical: 0 }}
                    />
                    {!!searchQuery && (
                        <Pressable onPress={() => onSearchChange('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
                            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Time range */}
            <SegmentedControl
                options={TIME_SEGMENTS}
                value={activeTimeFilter}
                onChange={f => {
                    if (f === 'Custom') onFilterPress();
                    onTimeFilterChange(f);
                }}
                className="mx-5"
            />

            {/* Category chips */}
            {categories.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 8 }}
                >
                    {categories.map(cat => {
                        const isSelected = selectedCategoryId === cat.id;
                        return (
                            <Pressable
                                key={cat.id}
                                onPress={() => onCategoryChange(isSelected ? null : cat.id)}
                                accessibilityRole="button"
                                accessibilityState={{ selected: isSelected }}
                                accessibilityLabel={`Filter by ${cat.name}`}
                                className="h-9 px-3.5 rounded-full flex-row items-center border"
                                style={({ pressed }) => ({
                                    backgroundColor: isSelected ? colors.textPrimary : pressed ? colors.backgroundAlt : 'transparent',
                                    borderColor: isSelected ? colors.textPrimary : colors.borderStrong,
                                })}
                            >
                                <ThemedText
                                    type="label"
                                    style={{ color: isSelected ? colors.background : colors.textSecondary }}
                                >
                                    {cat.name}
                                </ThemedText>
                                {isSelected && <Ionicons name="close" size={14} color={colors.background} style={{ marginLeft: 4 }} />}
                            </Pressable>
                        );
                    })}
                </ScrollView>
            )}

            {/* In / Out / Net strip */}
            <View className="px-5 pb-1">
                <Rule className="mb-3" />
                <View className="flex-row">
                    {[
                        { label: 'In', value: UserService.formatCurrency(income, currency), color: colors.income },
                        { label: 'Out', value: UserService.formatCurrency(expense, currency), color: colors.textPrimary },
                        {
                            label: 'Net',
                            value: `${net < 0 ? '−' : '+'}${UserService.formatCurrency(Math.abs(net), currency)}`,
                            color: net < 0 ? colors.expense : colors.textPrimary,
                        },
                    ].map((s, i) => (
                        <View
                            key={s.label}
                            className={`flex-1 ${i > 0 ? 'pl-3 border-l border-divider dark:border-dark-divider' : ''}`}
                            accessible
                            accessibilityLabel={`${s.label}: ${s.value}`}
                        >
                            <ThemedText type="kicker" className="mb-0.5">{s.label}</ThemedText>
                            <ThemedText type="figure" className="text-[15px]" style={{ color: s.color }} numberOfLines={1} adjustsFontSizeToFit>
                                {s.value}
                            </ThemedText>
                        </View>
                    ))}
                </View>
                <Rule className="mt-3" />
            </View>
        </View>
    );
}
