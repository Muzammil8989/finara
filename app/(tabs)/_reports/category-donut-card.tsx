import { AppCard, ThemedText } from '@/components/common';
import { CategoryExpense } from '@/lib/db/queries';
import { UserService } from '@/features/user/services/user-service';
import React from 'react';
import { View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { DEFAULT_COLORS } from './utils';

const PRIMARY_COLOR = '#246BFD';

interface CategoryDonutCardProps {
    categoryData: CategoryExpense[];
    currency: string;
}

export function CategoryDonutCard({ categoryData, currency }: CategoryDonutCardProps) {
    const fmt = (n: number) => UserService.formatCurrency(n, currency);

    if (categoryData.length === 0) return null;

    const totalCatExpense = categoryData.reduce((s, c) => s + c.total, 0);
    const pieData = categoryData.slice(0, 6).map((c, i) => ({
        value: c.total,
        color: c.categoryColor || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    }));

    return (
        <AppCard accentColor={PRIMARY_COLOR} className="p-5 mb-5" circleSize={100} circleOffset={28}>
            <View className="flex-row items-center gap-4">
                <View style={{ width: 130, height: 130, alignItems: 'center', justifyContent: 'center' }}>
                    <PieChart
                        data={pieData}
                        donut
                        radius={62}
                        innerRadius={40}
                        showText={false}
                        focusOnPress
                        isAnimated
                    />
                    <View style={{ position: 'absolute', alignItems: 'center' }}>
                        <ThemedText className="text-[9px] font-bold uppercase text-textMuted dark:text-dark-textMuted">Total</ThemedText>
                        <ThemedText className="text-sm font-bold text-textPrimary dark:text-dark-textPrimary" style={{ fontFamily: 'SpaceGrotesk_700Bold' }}>
                            {fmt(totalCatExpense)}
                        </ThemedText>
                    </View>
                </View>
                <View className="flex-1 gap-2.5">
                    {categoryData.slice(0, 5).map((c, i) => (
                        <View key={c.categoryId} className="flex-row items-center gap-2">
                            <View style={{
                                width: 10, height: 10, borderRadius: 3,
                                backgroundColor: c.categoryColor || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
                            }} />
                            <ThemedText className="text-xs font-bold flex-1 text-textSecondary dark:text-dark-textSecondary" numberOfLines={1}>
                                {c.categoryName}
                            </ThemedText>
                            <ThemedText className="text-xs font-bold text-textPrimary dark:text-dark-textPrimary">
                                {Math.round((c.total / totalCatExpense) * 100)}%
                            </ThemedText>
                        </View>
                    ))}
                </View>
            </View>
        </AppCard>
    );
}
