import { ProgressRing, ScreenHeader, SegmentedControl, ThemedText, type SegmentOption } from '@/components/common';
import { UserService } from '@/features/user/services/user-service';
import React from 'react';
import { View } from 'react-native';
import { SavingsFilter, SAVINGS_FILTER_OPTIONS } from '../utils';

interface SavingsHeaderProps {
    insets: { top: number };
    showSummary: boolean;
    totalSaved: number;
    totalTarget: number;
    overallPct: number;
    completedCount: number;
    goalCount: number;
    currency: string;
    activeFilter: SavingsFilter;
    onFilterChange: (f: SavingsFilter) => void;
}

const FILTER_SEGMENTS: readonly SegmentOption<SavingsFilter>[] =
    SAVINGS_FILTER_OPTIONS.map(o => ({ key: o.value, label: o.label }));

export function SavingsHeader({
    insets,
    showSummary,
    totalSaved,
    totalTarget,
    overallPct,
    completedCount,
    goalCount,
    currency,
    activeFilter,
    onFilterChange,
}: SavingsHeaderProps) {
    return (
        <View className="bg-background dark:bg-dark-background" style={{ paddingTop: insets.top }}>
            <ScreenHeader
                showBack={false}
                kicker={goalCount > 0 ? `${completedCount} of ${goalCount} goals reached` : 'Goals'}
                title="Savings"
            />

            {showSummary && (
                <View className="px-5 pb-5 flex-row items-center">
                    <View className="flex-1">
                        <ThemedText type="kicker" className="mb-1">Saved so far</ThemedText>
                        <ThemedText type="figure" className="text-[30px] leading-9" numberOfLines={1} adjustsFontSizeToFit>
                            {UserService.formatCurrency(totalSaved, currency)}
                        </ThemedText>
                        <ThemedText type="caption" style={{ fontVariant: ['tabular-nums'] }}>
                            of {UserService.formatCurrency(totalTarget, currency)} across all goals
                        </ThemedText>
                    </View>
                    <ProgressRing percent={overallPct} size={64} stroke={4} />
                </View>
            )}

            <SegmentedControl
                options={FILTER_SEGMENTS}
                value={activeFilter}
                onChange={onFilterChange}
                className="mx-5"
            />
        </View>
    );
}
