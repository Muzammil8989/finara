import { AppCard, ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { CategoryExpense } from '@/lib/db/queries';
import { UserService } from '@/features/user/services/user-service';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { DEFAULT_COLORS } from './utils';

interface TopCategoriesCardProps {
    categoryData: CategoryExpense[];
    currency: string;
}

export function TopCategoriesCard({ categoryData, currency }: TopCategoriesCardProps) {
    const colors = useThemeColors();
    const fmt = (n: number) => UserService.formatCurrency(n, currency);

    if (categoryData.length === 0) return null;

    const totalCatExpense = categoryData.reduce((s, c) => s + c.total, 0);

    return (
        <AppCard className="p-5 mb-5" circleSize={100} circleOffset={28}>
            <View className="gap-4">
                {categoryData.slice(0, 6).map((c, i) => {
                    const pct = totalCatExpense > 0 ? (c.total / totalCatExpense) * 100 : 0;
                    const color = c.categoryColor || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
                    return (
                        <View key={c.categoryId}>
                            <View className="flex-row items-center justify-between mb-1.5">
                                <View className="flex-row items-center gap-2 flex-1 mr-2">
                                    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                                        <Ionicons name={(c.categoryIcon || 'wallet') as IoniconsName} size={15} color={color} />
                                    </View>
                                    <ThemedText className="text-sm font-bold text-textPrimary dark:text-dark-textPrimary flex-1" numberOfLines={1}>
                                        {c.categoryName}
                                    </ThemedText>
                                </View>
                                <ThemedText className="text-sm font-bold text-textSecondary dark:text-dark-textSecondary flex-shrink-0" style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }} numberOfLines={1}>
                                    {fmt(c.total)}
                                </ThemedText>
                            </View>
                            <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.borderStrong }}>
                                <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 99 }} />
                            </View>
                            <ThemedText className="text-[10px] font-bold mt-0.5 text-right text-textMuted dark:text-dark-textMuted">
                                {Math.round(pct)}%
                            </ThemedText>
                        </View>
                    );
                })}
            </View>
        </AppCard>
    );
}
