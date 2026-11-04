import { parseLocalDate } from '@/lib/utils/date';
import { EditTransactionModal } from '@/features/transactions/components/edit-transaction-modal';
import { EmptyState, ErrorRetry, Skeleton, ThemedText } from '@/components/common';
import { useModals } from '@/providers/modal-context';
import { useUser } from '@/features/user/context/user-context';
import { UserService } from '@/features/user/services/user-service';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { Transaction, TransactionFilters, useTransactions } from '@/features/transactions/hooks/use-transactions';
import { deleteTransaction, isTransferCategory } from '@/lib/db/queries';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityHeader } from '@/features/transactions/components/activity-header';
import { DatePickerModal } from '@/features/transactions/components/date-picker-modal';
import { FilterModal } from '@/features/transactions/components/filter-modal';
import { TransactionActionSheet } from '@/features/transactions/components/transaction-action-sheet';
import { TransactionDeleteSheet } from '@/features/transactions/components/transaction-delete-sheet';
import { TransactionRow } from '@/features/transactions/components/transaction-row';
import { TimeFilter, getDateRange } from '@/features/transactions/utils';

function TransactionRowSkeleton() {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 }}>
            <Skeleton width={36} height={36} borderRadius={18} />
            <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Skeleton width="50%" height={13} borderRadius={4} style={{ marginBottom: 6 }} />
                <Skeleton width="35%" height={10} borderRadius={4} />
            </View>
            <Skeleton width={64} height={13} borderRadius={4} />
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
    const colors = useThemeColors();
    const { triggerRefresh } = useModals();
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
        const now = new Date();
        const today = now.toDateString();
        // Calendar arithmetic, not "now - 24h" (wrong across DST changes).
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toDateString();
        transactions.forEach(t => {
            // Parse YYYY-MM-DD as a local date; new Date('2025-03-10') is UTC
            // midnight, i.e. the previous day for anyone west of UTC.
            const date = t.date ? parseLocalDate(t.date) : now;
            const formatted = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
            const ds = date.toDateString();
            const title = ds === today ? `Today, ${formatted}` : ds === yesterday ? `Yesterday, ${formatted}` : formatted;
            if (!grouped[title]) grouped[title] = [];
            grouped[title].push(t);
        });
        return Object.keys(grouped).map(title => ({
            title,
            data: grouped[title],
            net: grouped[title].reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0),
        }));
    }, [transactions]);

    // ── Summary ───────────────────────────────────────────────
    const summary = useMemo(() => {
        let income = 0; let expense = 0;
        transactions.forEach(t => {
            if (isTransferCategory(t.category)) return; // lending/borrowing isn't income or spending
            if (t.type === 'income') income += t.amount; else expense += t.amount;
        });
        return { income, expense };
    }, [transactions]);

    // ── Delete handler ────────────────────────────────────────
    const handleConfirmDelete = useCallback(async () => {
        if (!deletingTransaction) return;
        setIsDeleting(true);
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            // Also removes linked household / loan records in the same DB transaction.
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

    const renderItem = useCallback(({ item, index, section }: { item: Transaction; index: number; section: { data: Transaction[] } }) => (
        <TransactionRow
            item={item}
            index={index}
            currency={profile.currency}
            onPress={setActionTransaction}
            onLongPress={setActionTransaction}
            ruled={index < section.data.length - 1}
        />
    ), [profile.currency]);

    const renderSectionHeader = useCallback(({ section: { title, net } }: { section: { title: string; net: number } }) => (
        <View
            className="px-5 pt-6 pb-1.5 flex-row items-baseline justify-between border-b border-borderStrong dark:border-dark-borderStrong mx-5"
            style={{ paddingHorizontal: 0 }}
            accessibilityRole="header"
        >
            <ThemedText type="label">{title}</ThemedText>
            <ThemedText type="figure" className="text-xs" style={{ color: net < 0 ? colors.textSecondary : colors.income }}>
                {net < 0 ? '−' : '+'}{UserService.formatCurrency(Math.abs(net), profile.currency)}
            </ThemedText>
        </View>
    ), [colors, profile.currency]);

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
                        tintColor={colors.primary}
                        colors={[colors.primary]}
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
                        count={loading && transactions.length === 0 ? undefined : transactions.length}
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
                            title="Nothing here"
                            subtitle={debouncedSearch || selectedCategoryId ? 'No transactions match these filters. Try clearing the search or category.' : 'Nothing recorded for this period yet. Tap + to add one.'}
                        />
                    )
                }
            />

            <FilterModal
                // Hidden while the date picker is open: two native Modals stacked
                // at once don't present reliably on iOS.
                visible={filterModalVisible && !showDatePicker}
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
                    minDate={showDatePicker === 'end' ? customStartDate : undefined}
                    maxDate={showDatePicker === 'start' ? customEndDate : undefined}
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
