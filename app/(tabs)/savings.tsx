import { EmptyState, Skeleton } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useModals } from '@/providers/modal-context';
import { useUser } from '@/features/user/context/user-context';
import { useSavingsGoals } from '@/features/savings/hooks/use-savings-goals';
import { deleteSavingsGoal } from '@/lib/db/queries';
import { SavingsGoal } from '@/lib/db/schema';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContributeSheet } from '@/features/savings/components/contribute-sheet';
import { DeleteSheet } from '@/features/savings/components/delete-sheet';
import { GoalCard } from '@/features/savings/components/goal-card';
import { GoalFormSheet } from '@/features/savings/components/goal-form-sheet';
import { SavingsHeader } from '@/features/savings/components/savings-header';
import { SavingsFilter } from '@/features/savings/utils';

/** Mirrors GoalCard's ruled-row layout. */
function GoalCardSkeleton() {
    return (
        <View style={{ paddingVertical: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Skeleton width={48} height={48} borderRadius={24} />
            <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Skeleton width="55%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                <Skeleton width="35%" height={10} borderRadius={4} />
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Skeleton width={64} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                <Skeleton width={48} height={10} borderRadius={4} />
            </View>
        </View>
    );
}

function GoalListSkeleton() {
    return (
        <View className="px-5 mt-2">
            {[0, 1, 2].map(i => <GoalCardSkeleton key={i} />)}
        </View>
    );
}

export default function SavingsScreen() {
    const { profile } = useUser();
    const insets = useSafeAreaInsets();
    const colors = useThemeColors();
    const { activeModal, openModal, closeModal, triggerRefresh } = useModals();
    const { goals, loading, refresh } = useSavingsGoals();

    const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
    const [deletingGoal, setDeletingGoal] = useState<SavingsGoal | null>(null);
    const [isDeletingGoal, setIsDeletingGoal] = useState(false);
    const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(null);
    const [filter, setFilter] = useState<SavingsFilter>('all');

    const showForm = activeModal === 'savings' || editingGoal !== null;

    // (Initial fetch is deferred inside the useSavingsGoals hook itself.)

    const { totalTarget, totalSaved, overallPct, completedCount } = useMemo(() => {
        const target = goals.reduce((s, g) => s + g.target_amount, 0);
        const saved = goals.reduce((s, g) => s + g.saved_amount, 0);
        return {
            totalTarget: target,
            totalSaved: saved,
            overallPct: target > 0 ? Math.min((saved / target) * 100, 100) : 0,
            completedCount: goals.filter(g => g.is_completed === 1).length,
        };
    }, [goals]);

    const filteredGoals = useMemo(() => {
        if (filter === 'active') return goals.filter(g => g.is_completed !== 1);
        if (filter === 'completed') return goals.filter(g => g.is_completed === 1);
        return goals;
    }, [goals, filter]);

    const handleDelete = useCallback(async () => {
        if (!deletingGoal) return;
        setIsDeletingGoal(true);
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteSavingsGoal(deletingGoal.id);
            setDeletingGoal(null);
            triggerRefresh();
        } catch (e) {
            logger.error('Failed to delete goal', e);
            toast.error('Failed to delete goal');
        } finally {
            setIsDeletingGoal(false);
        }
    }, [deletingGoal, triggerRefresh]);

    const showSkeleton = loading && goals.length === 0;
    const refreshing = loading && goals.length > 0;

    return (
        <View className="flex-1 bg-background dark:bg-dark-background">
            {/* Header stays put; only the content below it scrolls */}
            <SavingsHeader
                insets={insets}
                showSummary={!loading && goals.length > 0}
                totalSaved={totalSaved}
                totalTarget={totalTarget}
                overallPct={overallPct}
                completedCount={completedCount}
                goalCount={goals.length}
                currency={profile.currency}
                activeFilter={filter}
                onFilterChange={setFilter}
            />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* Content */}
                {showSkeleton ? (
                    <GoalListSkeleton />
                ) : goals.length === 0 ? (
                    <EmptyState
                        icon="trophy-outline"
                        title="No goals yet"
                        subtitle="Name something you're saving for and Folio will show what it takes each month."
                        actionLabel="Create a goal"
                        onAction={() => openModal('savings')}
                    />
                ) : filteredGoals.length === 0 ? (
                    <EmptyState
                        icon={filter === 'completed' ? 'checkmark-circle-outline' : 'trophy-outline'}
                        title={`No ${filter === 'completed' ? 'completed' : 'active'} goals`}
                        subtitle={
                            filter === 'completed'
                                ? 'Keep saving — your completed goals will appear here.'
                                : 'All your goals are completed. Great work!'
                        }
                    />
                ) : (
                    <View className="px-5">
                        {filteredGoals.map(goal => (
                            <GoalCard
                                key={goal.id}
                                goal={goal}
                                currency={profile.currency}
                                onEdit={setEditingGoal}
                                onDelete={setDeletingGoal}
                                onContribute={setContributingGoal}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>

            {showForm && (
                <GoalFormSheet
                    goal={editingGoal}
                    onClose={() => { closeModal(); setEditingGoal(null); }}
                    onSuccess={() => { closeModal(); setEditingGoal(null); triggerRefresh(); }}
                    onDelete={editingGoal ? () => { const g = editingGoal; closeModal(); setEditingGoal(null); setDeletingGoal(g); } : undefined}
                />
            )}

            {deletingGoal && (
                <DeleteSheet
                    name={deletingGoal.name}
                    onCancel={() => setDeletingGoal(null)}
                    onConfirm={handleDelete}
                    isDeleting={isDeletingGoal}
                />
            )}

            {contributingGoal && (
                <ContributeSheet
                    goal={contributingGoal}
                    currency={profile.currency}
                    onClose={() => setContributingGoal(null)}
                    onSuccess={() => { setContributingGoal(null); triggerRefresh(); }}
                />
            )}
        </View>
    );
}
