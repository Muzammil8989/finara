import { EmptyState, Skeleton } from '@/components/common';
import { BudgetWithSpend, useBudgets } from '@/features/budgets/hooks/use-budgets';
import { useModalActions } from '@/providers/modal-context';
import { useUser } from '@/features/user/context/user-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { deleteBudget } from '@/lib/db/queries';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BudgetCard } from '@/features/budgets/components/budget-card';
import { BudgetHeader } from '@/features/budgets/components/budget-header';
import { DeleteConfirmSheet } from '@/features/budgets/components/delete-confirm-sheet';
import { PeriodFilter, summarizeBudgets } from '@/features/budgets/utils';

/** Mirrors BudgetCard's ruled-row layout so nothing jumps when data arrives. */
function BudgetCardSkeleton() {
    return (
        <View style={{ paddingVertical: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Skeleton width={36} height={36} borderRadius={18} />
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Skeleton width="55%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                    <Skeleton width="30%" height={10} borderRadius={4} />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Skeleton width={64} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                    <Skeleton width={48} height={10} borderRadius={4} />
                </View>
            </View>
            <Skeleton height={6} borderRadius={3} />
            <Skeleton width="28%" height={10} borderRadius={4} style={{ marginTop: 8 }} />
        </View>
    );
}

function BudgetListSkeleton() {
    return (
        <View className="px-5 mt-2">
            {[0, 1, 2, 3].map(i => <BudgetCardSkeleton key={i} />)}
        </View>
    );
}

export default function BudgetScreen() {
    const { profile } = useUser();
    const insets = useSafeAreaInsets();
    const colors = useThemeColors();
    const { openModal, triggerRefresh } = useModalActions();
    const { budgets, loading, refresh } = useBudgets();

    const [deletingBudget, setDeletingBudget] = useState<BudgetWithSpend | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');

    // (Initial fetch is now deferred inside the useBudgets hook itself, so we
    // don't need a second mount-effect here.)

    const filteredBudgets = useMemo(() =>
        periodFilter === 'all' ? budgets : budgets.filter(b => b.period === periodFilter),
        [budgets, periodFilter],
    );

    const { totalBudgeted, totalSpent, overallPercent, isMonthlyEquivalent } = useMemo(
        () => summarizeBudgets(filteredBudgets),
        [filteredBudgets],
    );

    const handleConfirmDelete = useCallback(async () => {
        if (!deletingBudget) return;
        setIsDeleting(true);
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteBudget(deletingBudget.id);
            setDeletingBudget(null);
            triggerRefresh(['budgets']);
        } catch (e) {
            logger.error('Failed to delete budget', e);
            toast.error('Failed to delete budget');
        } finally {
            setIsDeleting(false);
        }
    }, [deletingBudget, triggerRefresh]);

    const [isRefreshing, setIsRefreshing] = useState(false);
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await refresh();
        setIsRefreshing(false);
    }, [refresh]);

    const handleAddPress = useCallback(() => openModal('budget'), [openModal]);
    const handleEditBudget = useCallback((b: BudgetWithSpend) => openModal('budget', { budget: b }), [openModal]);
    const handleDeleteBudget = useCallback((b: BudgetWithSpend) => setDeletingBudget(b), []);

    const periodLabel = periodFilter !== 'all'
        ? periodFilter.charAt(0).toUpperCase() + periodFilter.slice(1) + ' '
        : '';

    const showSkeleton = loading && budgets.length === 0;

    return (
        <View className="flex-1 bg-background dark:bg-dark-background">
            {/* Header stays put; only the content below it scrolls */}
            <BudgetHeader
                insets={insets}
                periodFilter={periodFilter}
                onPeriodChange={setPeriodFilter}
                totalSpent={totalSpent}
                totalBudgeted={totalBudgeted}
                overallPercent={overallPercent}
                isMonthlyEquivalent={isMonthlyEquivalent}
                currency={profile.currency}
                showSummary={!loading && filteredBudgets.length > 0}
                count={loading ? undefined : filteredBudgets.length}
            />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* Content */}
                {showSkeleton ? (
                    <BudgetListSkeleton />
                ) : filteredBudgets.length === 0 ? (
                    <EmptyState
                        icon="pie-chart-outline"
                        title={periodFilter === 'all' ? 'No budgets yet' : `No ${periodLabel.toLowerCase()}budgets`}
                        subtitle={
                            periodFilter === 'all'
                                ? 'Set a limit for a category and Folio will tell you when you get close.'
                                : `No ${periodFilter} budgets. Try a different filter.`
                        }
                        actionLabel={periodFilter === 'all' ? 'Create a budget' : undefined}
                        onAction={periodFilter === 'all' ? handleAddPress : undefined}
                    />
                ) : (
                    <View className="px-5">
                        {filteredBudgets.map(budget => (
                            <BudgetCard
                                key={budget.id}
                                budget={budget}
                                currency={profile.currency}
                                onEdit={handleEditBudget}
                                onDelete={handleDeleteBudget}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>

            {deletingBudget && (
                <DeleteConfirmSheet
                    title={deletingBudget.categoryName ?? 'All Categories'}
                    onCancel={() => setDeletingBudget(null)}
                    onConfirm={handleConfirmDelete}
                    isDeleting={isDeleting}
                />
            )}
        </View>
    );
}
