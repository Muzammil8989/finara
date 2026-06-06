import { EmptyState, Skeleton, ThemedText } from '@/components/common';
import { AddBudgetModal } from '@/features/budgets/components/add-budget-modal';
import { BudgetWithSpend, useBudgets } from '@/features/budgets/hooks/use-budgets';
import { useModals } from '@/context/modal-context';
import { useUser } from '@/features/user/context/user-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { deleteBudget } from '@/lib/db/queries';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BudgetCard } from './_budget/budget-card';
import { BudgetHeader } from './_budget/budget-header';
import { DeleteConfirmSheet } from './_budget/delete-confirm-sheet';
import { PeriodFilter } from './_budget/utils';

const PRIMARY_COLOR = '#246BFD';

function BudgetCardSkeleton() {
    return (
        <View style={{ marginBottom: 12, padding: 16, borderRadius: 16, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Skeleton height={14} borderRadius={7} style={{ marginBottom: 6 }} />
                    <Skeleton width="45%" height={11} borderRadius={6} />
                </View>
                <Skeleton width={50} height={14} borderRadius={7} />
            </View>
            <Skeleton height={8} borderRadius={4} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Skeleton width="38%" height={11} borderRadius={6} />
                <Skeleton width="22%" height={11} borderRadius={6} />
            </View>
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
    const { openModal, refreshSignal, triggerRefresh } = useModals();
    const { budgets, loading, refresh } = useBudgets();

    const [editingBudget, setEditingBudget] = useState<BudgetWithSpend | null>(null);
    const [deletingBudget, setDeletingBudget] = useState<BudgetWithSpend | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');

    // (Initial fetch is now deferred inside the useBudgets hook itself, so we
    // don't need a second mount-effect here.)

    const filteredBudgets = useMemo(() =>
        periodFilter === 'all' ? budgets : budgets.filter(b => b.period === periodFilter),
        [budgets, periodFilter],
    );

    const { totalBudgeted, totalSpent, overallPercent } = useMemo(() => {
        const budgeted = filteredBudgets.reduce((s, b) => s + b.amount, 0);
        const spent = filteredBudgets.reduce((s, b) => s + b.spent, 0);
        return {
            totalBudgeted: budgeted,
            totalSpent: spent,
            overallPercent: budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0,
        };
    }, [filteredBudgets]);

    const handleConfirmDelete = useCallback(async () => {
        if (!deletingBudget) return;
        setIsDeleting(true);
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteBudget(deletingBudget.id);
            setDeletingBudget(null);
            refresh();
            triggerRefresh();
        } catch (e) {
            logger.error('Failed to delete budget', e);
            toast.error('Failed to delete budget');
        } finally {
            setIsDeleting(false);
        }
    }, [deletingBudget, refresh, triggerRefresh]);

    const [isRefreshing, setIsRefreshing] = useState(false);
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await refresh();
        setIsRefreshing(false);
    }, [refresh]);

    const handleAddPress = useCallback(() => openModal('budget'), [openModal]);
    const handleEditBudget = useCallback((b: BudgetWithSpend) => setEditingBudget(b), []);
    const handleDeleteBudget = useCallback((b: BudgetWithSpend) => setDeletingBudget(b), []);
    const handleCloseEditModal = useCallback(() => setEditingBudget(null), []);
    const handleBudgetSuccess = useCallback(() => { setEditingBudget(null); refresh(); triggerRefresh(); }, [refresh, triggerRefresh]);

    const periodLabel = periodFilter !== 'all'
        ? periodFilter.charAt(0).toUpperCase() + periodFilter.slice(1) + ' '
        : '';

    const showSkeleton = loading && budgets.length === 0;

    return (
        <View className="flex-1 bg-background dark:bg-dark-background">
            <ScrollView
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={PRIMARY_COLOR}
                        colors={[PRIMARY_COLOR]}
                    />
                }
            >
                {/* Sticky header */}
                <BudgetHeader
                    insets={insets}
                    periodFilter={periodFilter}
                    onPeriodChange={setPeriodFilter}
                    totalSpent={totalSpent}
                    totalBudgeted={totalBudgeted}
                    overallPercent={overallPercent}
                    currency={profile.currency}
                    showSummary={!loading && filteredBudgets.length > 0}
                    onAddPress={handleAddPress}
                />

                {/* Content */}
                {showSkeleton ? (
                    <BudgetListSkeleton />
                ) : filteredBudgets.length === 0 ? (
                    <EmptyState
                        icon="pie-chart-outline"
                        title={periodFilter === 'all' ? 'No Budgets Yet' : `No ${periodLabel}Budgets`}
                        subtitle={
                            periodFilter === 'all'
                                ? 'Create a budget to start tracking your spending.'
                                : `No ${periodFilter} budgets. Try a different filter.`
                        }
                        actionLabel={periodFilter === 'all' ? 'Create First Budget' : undefined}
                        onAction={periodFilter === 'all' ? handleAddPress : undefined}
                    />
                ) : (
                    <View className="px-5 mt-2">
                        <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-3">
                            {filteredBudgets.length} {periodLabel}Budget{filteredBudgets.length !== 1 ? 's' : ''}
                        </ThemedText>
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

            <AddBudgetModal
                visible={editingBudget !== null}
                editBudget={editingBudget}
                onClose={handleCloseEditModal}
                onSuccess={handleBudgetSuccess}
            />

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
