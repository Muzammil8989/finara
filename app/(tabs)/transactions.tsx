import { EditTransactionModal } from '@/features/transactions/components/edit-transaction-modal';
import { ErrorRetry } from '@/features/transactions/components/error-retry';
import { EmptyState, Skeleton, ThemedText } from '@/components/common';
import { useModals } from '@/context/modal-context';
import { useUser } from '@/features/user/context/user-context';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { Transaction, TransactionFilters, useTransactions } from '@/features/transactions/hooks/use-transactions';
import { deleteLinkedHouseholdTransferExpense, deleteTransaction } from '@/lib/db/queries';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityHeader } from './_activity/activity-header';
import { DatePickerModal } from './_activity/date-picker-modal';
import { FilterModal } from './_activity/filter-modal';
import { TransactionActionSheet } from './_activity/transaction-action-sheet';
import { TransactionDeleteSheet } from './_activity/transaction-delete-sheet';
import { TransactionRow } from './_activity/transaction-row';
import { TimeFilter, getDateRange } from './_activity/utils';

const PRIMARY_COLOR = '#246BFD';

function TransactionRowSkeleton() {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, marginBottom: 4 }}>
            <Skeleton width={44} height={44} borderRadius={22} />
            <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Skeleton height={13} borderRadius={6} style={{ marginBottom: 6 }} />
                <Skeleton width="55%" height={11} borderRadius={6} />
            </View>
            <Skeleton width={64} height={13} borderRadius={6} />
        </View>
    );
}

function TransactionListSkeleton() {
    return (
        <View>
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <TransactionRowSkeleton key={i} />)}
        </View>
    );
}

export default function TransactionsScreen() {
    const { profile } = useUser();
    const insets = useSafeAreaInsets();
    const { refreshSignal, triggerRefresh } = useModals();
    const { categories } = useCategories();

    // ── Filter state ──────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [activeTimeFilter, setActiveTimeFilter] = useState<TimeFilter | null>('Month');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    const handleTimeFilterChange = useCallback((f: TimeFilter) => {
        setActiveTimeFilter(f);
        setSelectedCategoryId(null);
    }, []);

    const handleCategoryChange = useCallback((id: number | null) => {
        setSelectedCategoryId(id);
        if (id !== null) setActiveTimeFilter(null);
    }, []);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [customStartDate, setCustomStartDate] = useState(new Date());
    const [customEndDate, setCustomEndDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
    const [viewDate, setViewDate] = useState(new Date());

    // ── Selection / action state ──────────────────────────────
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [actionTransaction, setActionTransaction] = useState<Transaction | null>(null);
    const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // ── Search debounce ───────────────────────────────────────
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
    }, [searchQuery]);

    // ── Sync view date to picker mode ─────────────────────────
    useEffect(() => {
        if (showDatePicker === 'start') setViewDate(new Date(customStartDate));
        else if (showDatePicker === 'end') setViewDate(new Date(customEndDate));
    }, [showDatePicker, customStartDate, customEndDate]);

    // ── DB filters ────────────────────────────────────────────
    const dbFilters = useMemo<TransactionFilters>(() => {
        const filters: TransactionFilters = {};
        if (debouncedSearch.trim()) filters.searchQuery = debouncedSearch.trim();
        if (selectedCategoryId) filters.categoryId = selectedCategoryId;
        const dateRange = getDateRange(activeTimeFilter, customStartDate, customEndDate);
        if (dateRange) { filters.startDate = dateRange.startDate; filters.endDate = dateRange.endDate; }
        return filters;
    }, [debouncedSearch, selectedCategoryId, activeTimeFilter, customStartDate, customEndDate]);

    const { transactions, loading, error, refresh } = useTransactions(dbFilters);

    // (Initial fetch is deferred inside the useTransactions hook itself.)

    // ── Grouped sections ──────────────────────────────────────
    const sections = useMemo(() => {
        const grouped: { [key: string]: Transaction[] } = {};
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86_400_000).toDateString();
        transactions.forEach(t => {
            const date = new Date(t.date ?? new Date().toISOString());
            const formatted = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
            const ds = date.toDateString();
            const title = ds === today ? `Today, ${formatted}` : ds === yesterday ? `Yesterday, ${formatted}` : formatted;
            if (!grouped[title]) grouped[title] = [];
            grouped[title].push(t);
        });
        return Object.keys(grouped).map(title => ({ title, data: grouped[title] }));
    }, [transactions]);

    // ── Summary ───────────────────────────────────────────────
    const summary = useMemo(() => {
        let income = 0; let expense = 0;
        transactions.forEach(t => { if (t.type === 'income') income += t.amount; else expense += t.amount; });
        return { income, expense };
    }, [transactions]);

    // ── Delete handler ────────────────────────────────────────
    const handleConfirmDelete = useCallback(async () => {
        if (!deletingTransaction) return;
        setIsDeleting(true);
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            if (
                deletingTransaction.note === 'Household budget transfer' &&
                deletingTransaction.date
            ) {
                await deleteLinkedHouseholdTransferExpense(deletingTransaction.date, deletingTransaction.amount);
            }
            await deleteTransaction(deletingTransaction.id);
            setDeletingTransaction(null);
            refresh();
            triggerRefresh();
        } catch (e) {
            logger.error('Failed to delete transaction', e);
            toast.error('Failed to delete transaction');
        } finally {
            setIsDeleting(false);
        }
    }, [deletingTransaction, refresh, triggerRefresh]);

    const showSkeleton = loading && sections.length === 0;

    const [isRefreshing, setIsRefreshing] = useState(false);
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await refresh();
        setIsRefreshing(false);
    }, [refresh]);

    const renderItem = useCallback(({ item, index }: { item: Transaction; index: number }) => (
        <TransactionRow
            item={item}
            index={index}
            currency={profile.currency}
            onLongPress={setActionTransaction}
        />
    ), [profile.currency]);

    const renderSectionHeader = useCallback(({ section: { title } }: { section: { title: string } }) => (
        <View className="px-5 mb-2 mt-5">
            <ThemedText className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
                {title}
            </ThemedText>
        </View>
    ), []);

    return (
        <View className="flex-1 bg-background dark:bg-dark-background">
            <SectionList
                sections={sections}
                keyExtractor={item => item.id.toString()}
                stickySectionHeadersEnabled={false}
                removeClippedSubviews
                maxToRenderPerBatch={15}
                updateCellsBatchingPeriod={50}
                initialNumToRender={10}
                windowSize={5}
                contentContainerStyle={{ paddingBottom: 150 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={PRIMARY_COLOR}
                        colors={[PRIMARY_COLOR]}
                    />
                }
                ListHeaderComponent={
                    <ActivityHeader
                        insets={insets}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        activeTimeFilter={activeTimeFilter}
                        onTimeFilterChange={handleTimeFilterChange}
                        selectedCategoryId={selectedCategoryId}
                        onCategoryChange={handleCategoryChange}
                        onFilterPress={() => setFilterModalVisible(true)}
                        categories={categories}
                        income={summary.income}
                        expense={summary.expense}
                        currency={profile.currency}
                    />
                }
                renderSectionHeader={renderSectionHeader}
                renderItem={renderItem}
                ListEmptyComponent={
                    showSkeleton ? (
                        <TransactionListSkeleton />
                    ) : error ? (
                        <ErrorRetry message="Failed to load transactions" onRetry={refresh} />
                    ) : (
                        <EmptyState
                            icon="search-outline"
                            title="Nothing Found"
                            subtitle="No transactions match your current filters."
                        />
                    )
                }
            />

            <FilterModal
                visible={filterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                activeTimeFilter={activeTimeFilter}
                onTimeFilterChange={handleTimeFilterChange}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onStartDatePress={() => setShowDatePicker('start')}
                onEndDatePress={() => setShowDatePicker('end')}
            />

            {showDatePicker && (
                <DatePickerModal
                    visible
                    mode={showDatePicker}
                    selectedDate={showDatePicker === 'start' ? customStartDate : customEndDate}
                    onDateChange={showDatePicker === 'start' ? setCustomStartDate : setCustomEndDate}
                    viewDate={viewDate}
                    onViewDateChange={setViewDate}
                    onClose={() => setShowDatePicker(null)}
                />
            )}

            <EditTransactionModal
                visible={!!editingTransaction}
                transaction={editingTransaction}
                onClose={() => setEditingTransaction(null)}
                onSuccess={() => { refresh(); triggerRefresh(); }}
            />

            {actionTransaction && (
                <TransactionActionSheet
                    transaction={actionTransaction}
                    profile={profile}
                    onEdit={() => { setEditingTransaction(actionTransaction); setActionTransaction(null); }}
                    onDelete={() => { setDeletingTransaction(actionTransaction); setActionTransaction(null); }}
                    onClose={() => setActionTransaction(null)}
                />
            )}

            {deletingTransaction && (
                <TransactionDeleteSheet
                    transaction={deletingTransaction}
                    profile={profile}
                    isDeleting={isDeleting}
                    onCancel={() => setDeletingTransaction(null)}
                    onConfirm={handleConfirmDelete}
                />
            )}
        </View>
    );
}
