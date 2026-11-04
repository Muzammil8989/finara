import { EmptyState, ScreenHeader, ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useUser } from '@/features/user/context/user-context';
import { isDbReady } from '@/lib/db/db-client';
import {
    deleteHouseholdHistoryEntry,
    listHouseholdHistory,
    type HouseholdPeriodHistory,
} from '@/lib/db/queries';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import { UserService } from '@/features/user/services/user-service';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PERIOD_LABELS: Record<string, string> = {
    monthly: 'Monthly',
    weekly: 'Weekly',
    yearly: 'Yearly',
};

type HistoryFilter = 'all' | 'monthly' | 'weekly' | 'yearly';
const FILTERS: { key: HistoryFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'yearly', label: 'Yearly' },
];

function formatRange(startISO: string, endISO: string): string {
    const [, sm, sd] = startISO.split('-').map(Number);
    const [ey, em, ed] = endISO.split('-').map(Number);
    return `${MONTH_NAMES[sm - 1]} ${sd} – ${MONTH_NAMES[em - 1]} ${ed}, ${ey}`;
}

function HistoryRow({
    entry,
    currencyCode,
    onDelete,
}: {
    entry: HouseholdPeriodHistory;
    currencyCode: string;
    onDelete: (entry: HouseholdPeriodHistory) => void;
}) {
    const colors = useThemeColors();
    const isOver = entry.remaining_amount < 0;
    const remainingColor = isOver ? colors.error : colors.success;
    const pctUsed = entry.income_amount > 0
        ? Math.min((entry.spent_amount / entry.income_amount) * 100, 100)
        : 0;

    return (
        <View
            className="rounded-xl p-4 mb-3"
            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider }}
        >
            <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2 flex-1">
                    <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                    <ThemedText
                        type="kicker"
                        numberOfLines={1}
                    >
                        {PERIOD_LABELS[entry.period] ?? entry.period} · {formatRange(entry.start_date, entry.end_date)}
                    </ThemedText>
                </View>
                <Pressable
                    onPress={() => onDelete(entry)}
                    hitSlop={8}
                    className="w-8 h-8 items-center justify-center rounded-lg"
                >
                    <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                </Pressable>
            </View>

            <View className="flex-row items-center justify-between mt-1">
                <View className="flex-1">
                    <ThemedText type="kicker" className="mb-0.5">
                        Income
                    </ThemedText>
                    <ThemedText className="text-base font-semibold text-textPrimary dark:text-dark-textPrimary" numberOfLines={1} adjustsFontSizeToFit>
                        {UserService.formatCurrency(entry.income_amount, currencyCode)}
                    </ThemedText>
                </View>

                <View className="w-px h-8 bg-divider dark:bg-dark-divider mx-3" />

                <View className="flex-1 items-center">
                    <ThemedText type="kicker" className="mb-0.5">
                        Spent
                    </ThemedText>
                    <ThemedText
                        className="text-base font-semibold"
                        style={{ color: entry.spent_amount > 0 ? colors.error : colors.textPrimary }}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {UserService.formatCurrency(entry.spent_amount, currencyCode)}
                    </ThemedText>
                </View>

                <View className="w-px h-8 bg-divider dark:bg-dark-divider mx-3" />

                <View className="flex-1 items-end">
                    <ThemedText type="kicker" className="mb-0.5">
                        {isOver ? 'Over' : 'Left'}
                    </ThemedText>
                    <ThemedText
                        className="text-base font-semibold"
                        style={{ color: remainingColor }}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {UserService.formatCurrency(Math.abs(entry.remaining_amount), currencyCode)}
                    </ThemedText>
                </View>
            </View>

            {entry.income_amount > 0 && (
                <View className="mt-3">
                    <View className="h-1.5 bg-borderStrong dark:bg-dark-borderStrong rounded-full overflow-hidden">
                        <View
                            style={{ width: `${pctUsed}%`, backgroundColor: remainingColor }}
                            className="h-full rounded-full"
                        />
                    </View>
                    <ThemedText className="text-[11px] font-semibold text-textMuted dark:text-dark-textMuted text-right mt-1">
                        {Math.round(pctUsed)}% used · {entry.expense_count} {entry.expense_count === 1 ? 'expense' : 'expenses'}
                    </ThemedText>
                </View>
            )}
        </View>
    );
}

export default function HouseholdHistoryScreen() {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const { profile } = useUser();
    const currencyCode = profile.currency;

    const [entries, setEntries] = useState<HouseholdPeriodHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<HistoryFilter>('all');

    const filtered = filter === 'all' ? entries : entries.filter(e => e.period === filter);

    const load = useCallback(async () => {
        if (!isDbReady()) return;
        setLoading(true);
        try {
            const rows = await listHouseholdHistory();
            setEntries(rows);
        } catch (e) {
            logger.error('HouseholdHistoryScreen: load failed', e);
            toast.error('Failed to load history');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleDelete = async (entry: HouseholdPeriodHistory) => {
        try {
            await deleteHouseholdHistoryEntry(entry.id);
            toast.success('History entry removed');
            load();
        } catch (e) {
            logger.error('HouseholdHistoryScreen: delete failed', e);
            toast.error('Failed to delete entry');
        }
    };

    return (
        <View className="flex-1 bg-background dark:bg-dark-background">

            <ScrollView
                className="flex-1"
                style={{ paddingTop: insets.top }}
                contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
                showsVerticalScrollIndicator={false}
            >
                <ScreenHeader title="Household History" subtitle="Past budget periods" />

                <View className="px-5">
                    {loading ? (
                        <View className="py-24 items-center">
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : entries.length === 0 ? (
                        <EmptyState
                            icon="time-outline"
                            title="No History Yet"
                            subtitle={`Past periods will appear here\nonce a cycle ends.`}
                            iconColor={colors.primary}
                        />
                    ) : (
                        <Animated.View entering={FadeInDown.duration(350).easing(Easing.out(Easing.cubic))}>
                            {/* Period filter chips */}
                            <View className="flex-row gap-2 mb-4">
                                {FILTERS.map(f => {
                                    const active = filter === f.key;
                                    return (
                                        <Pressable
                                            key={f.key}
                                            onPress={() => setFilter(f.key)}
                                            className="flex-1 py-2 rounded-xl items-center"
                                            style={{
                                                backgroundColor: active
                                                    ? colors.primary
                                                    : colors.scheme === 'dark' ? colors.gray800 : colors.gray100,
                                            }}
                                        >
                                            <ThemedText
                                                className="text-xs font-bold"
                                                style={{ color: active ? '#fff' : colors.textSecondary }}
                                            >
                                                {f.label}
                                            </ThemedText>
                                        </Pressable>
                                    );
                                })}
                            </View>

                            <View className="flex-row items-center justify-between mb-3">
                                <ThemedText type="kicker">
                                    Archived Periods
                                </ThemedText>
                                <ThemedText className="text-xs font-medium text-textMuted dark:text-dark-textMuted">
                                    {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
                                </ThemedText>
                            </View>

                            {filtered.length === 0 ? (
                                <View className="py-16 items-center">
                                    <Ionicons name="funnel-outline" size={28} color={colors.textMuted} />
                                    <ThemedText className="text-sm font-medium mt-3 text-textMuted dark:text-dark-textMuted">
                                        No {PERIOD_LABELS[filter]?.toLowerCase() ?? ''} periods yet
                                    </ThemedText>
                                </View>
                            ) : (
                                filtered.map(entry => (
                                    <HistoryRow
                                        key={entry.id}
                                        entry={entry}
                                        currencyCode={currencyCode}
                                        onDelete={handleDelete}
                                    />
                                ))
                            )}
                        </Animated.View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
