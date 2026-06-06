import { EmptyState, Skeleton, ThemedText } from '@/components/common';
import { useModals } from '@/context/modal-context';
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
import { ContributeSheet } from './_savings/contribute-sheet';
import { DeleteSheet } from './_savings/delete-sheet';
import { GoalCard } from './_savings/goal-card';
import { GoalFormSheet } from './_savings/goal-form-sheet';
import { SavingsHeader } from './_savings/savings-header';
import { SavingsFilter } from './_savings/utils';

const PRIMARY_COLOR = '#246BFD';

function GoalCardSkeleton() {
    return (
        <View style={{ marginBottom: 12, padding: 16, borderRadius: 20, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <Skeleton width={48} height={48} borderRadius={24} />
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Skeleton height={15} borderRadius={7} style={{ marginBottom: 7 }} />
                    <Skeleton width="50%" height={11} borderRadius={6} />
                </View>
                <Skeleton width={60} height={15} borderRadius={7} />
            </View>
            <Skeleton height={8} borderRadius={4} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Skeleton width="42%" height={11} borderRadius={6} />
                <Skeleton width="20%" height={11} borderRadius={6} />
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
    const { refreshSignal, activeModal, openModal, closeModal, triggerRefresh } = useModals();
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
            refresh();
            triggerRefresh();
        } catch (e) {
            logger.error('Failed to delete goal', e);
            toast.error('Failed to delete goal');
        } finally {
            setIsDeletingGoal(false);
        }
    }, [deletingGoal, refresh, triggerRefresh]);

    const showSkeleton = loading && goals.length === 0;
    const refreshing = loading && goals.length > 0;

    return (
        <View className="flex-1 bg-background dark:bg-dark-background">
            <ScrollView
                contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refresh}
                        tintColor={PRIMARY_COLOR}
                        colors={[PRIMARY_COLOR]}
                    />
                }
            >
                {/* Sticky header */}
                <SavingsHeader
                    insets={insets}
                    showSummary={!loading && goals.length > 0}
                    totalSaved={totalSaved}
                    totalTarget={totalTarget}
                    overallPct={overallPct}
                    completedCount={completedCount}
                    currency={profile.currency}
                    activeFilter={filter}
                    onFilterChange={setFilter}
                    onAddPress={() => openModal('savings')}
                />

                {/* Content */}
                {showSkeleton ? (
                    <GoalListSkeleton />
                ) : goals.length === 0 ? (
                    <EmptyState
                        icon="trophy-outline"
                        title="No Goals Yet"
                        subtitle="Set a goal and start building towards your dreams."
                        actionLabel="Create First Goal"
                        onAction={() => openModal('savings')}
                    />
                ) : filteredGoals.length === 0 ? (
                    <EmptyState
                        icon={filter === 'completed' ? 'checkmark-circle-outline' : 'trophy-outline'}
                        title={`No ${filter === 'completed' ? 'Completed' : 'Active'} Goals`}
                        subtitle={
                            filter === 'completed'
                                ? 'Keep saving — your completed goals will appear here.'
                                : 'All your goals are completed. Great work!'
                        }
                    />
                ) : (
                    <View className="px-5 mt-2">
                        <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-3">
                            {filteredGoals.length} Goal{filteredGoals.length !== 1 ? 's' : ''}
                        </ThemedText>
                        {filteredGoals.map(goal => (
                            <GoalCard
                                key={goal.id}
                                goal={goal}
                                currency={profile.currency}
                                onEdit={() => setEditingGoal(goal)}
                                onDelete={() => setDeletingGoal(goal)}
                                onContribute={() => setContributingGoal(goal)}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>

            {showForm && (
                <GoalFormSheet
                    goal={editingGoal}
                    onClose={() => { closeModal(); setEditingGoal(null); }}
                    onSuccess={() => { closeModal(); setEditingGoal(null); triggerRefresh(); refresh(); }}
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
                    onSuccess={() => { setContributingGoal(null); refresh(); }}
                />
            )}
        </View>
    );
}
