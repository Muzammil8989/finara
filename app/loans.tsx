import { EmptyState, Fab, ScreenHeader, ThemedText } from '@/components/common';
import { AddLoanModal } from '@/features/loans/components/add-loan-modal';
import { RecordPaymentModal } from '@/features/loans/components/record-payment-modal';
import { LoanItem } from '@/features/loans/components/loan-item';
import { LoanSummaryCard } from '@/features/loans/components/loan-summary-card';
import { DeleteConfirmSheet } from '@/features/loans/components/delete-confirm-sheet';
import { useLoans } from '@/features/loans/hooks/use-loans';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useUser } from '@/features/user/context/user-context';
import { useModals } from '@/providers/modal-context';
import { deleteLoan, transferLoanToAccount, LoanWithDetails } from '@/lib/db/queries';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FilterTab = 'all' | 'given' | 'taken';

export default function LoansScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { profile } = useUser();
  const { triggerRefresh } = useModals();
  const currencyCode = profile.currency;

  const [filter, setFilter] = useState<FilterTab>('all');
  const { loans, summary, categoryIds, loading, refresh } = useLoans(filter);

  const [addVisible, setAddVisible] = useState(false);
  const [editingLoan, setEditingLoan] = useState<LoanWithDetails | null>(null);
  const [paymentLoan, setPaymentLoan] = useState<LoanWithDetails | null>(null);
  const [deletingLoan, setDeletingLoan] = useState<LoanWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenAdd = () => {
    setEditingLoan(null);
    setAddVisible(true);
  };

  const handleOpenEdit = (loan: LoanWithDetails) => {
    setEditingLoan(loan);
    setAddVisible(true);
  };

  const handleTransfer = async (loan: LoanWithDetails) => {
    if (!categoryIds) return;
    try {
      await transferLoanToAccount(loan.id, categoryIds);
      toast.success('Transferred to account');
      refresh();
      triggerRefresh();
    } catch (e) {
      logger.error('LoansScreen: transfer failed', e);
      toast.error(e instanceof Error && e.message === 'Loan is not fully repaid yet' ? e.message : 'Transfer failed');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingLoan) return;
    setIsDeleting(true);
    try {
      await deleteLoan(deletingLoan.id);
      toast.success('Loan deleted');
      setDeletingLoan(null);
      refresh();
      triggerRefresh();
    } catch (e) {
      logger.error('LoansScreen: delete failed', e);
      toast.error('Failed to delete loan');
    } finally {
      setIsDeleting(false);
    }
  };

  const filterTabs: { key: FilterTab; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: colors.primary },
    { key: 'given', label: 'Given', color: colors.warning },
    { key: 'taken', label: 'Taken', color: colors.info },
  ];

  return (
    <View className="flex-1 bg-background dark:bg-dark-background">

      <ScrollView
        className="flex-1"
        style={{ paddingTop: insets.top }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Loans & Borrowings"
          subtitle="Track money given and taken"
        />

        {/* Summary Card */}
        <LoanSummaryCard summary={summary} currencyCode={currencyCode} />

        {/* Filter Tabs */}
        <View className="flex-row mx-6 mb-4 rounded-xl overflow-hidden" style={{ backgroundColor: colors.tagDefaultBg }}>
          {filterTabs.map((tab) => {
            const isActive = filter === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setFilter(tab.key)}
                className="flex-1 py-2.5 items-center rounded-xl"
                style={isActive ? { backgroundColor: tab.color } : undefined}
              >
                <ThemedText
                  className="text-sm font-bold"
                  style={{ color: isActive ? colors.textOnPrimary : colors.textMuted }}
                >
                  {tab.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {/* Content */}
        {loading ? (
          <View className="py-24 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : loans.length === 0 ? (
          <EmptyState
            icon="cash-outline"
            title={filter === 'all' ? 'No Loans Yet' : filter === 'given' ? 'No Loans Given' : 'No Loans Taken'}
            subtitle={
              filter === 'all'
                ? 'Tap + to record money you gave or took as a loan.'
                : filter === 'given'
                ? 'No money you lent out. Tap + to add one.'
                : 'No money you borrowed. Tap + to add one.'
            }
            actionLabel="Add Loan"
            onAction={handleOpenAdd}
            iconColor={colors.warning}
          />
        ) : (
          <Animated.View entering={FadeInDown.duration(350).easing(Easing.out(Easing.cubic))}>
            {/* Section label */}
            <View className="flex-row items-center justify-between mx-6 mb-3">
              <ThemedText type="kicker">
                {filter === 'all' ? 'All Loans' : filter === 'given' ? 'Given Out' : 'Taken'}
              </ThemedText>
              <ThemedText className="text-xs font-medium text-textMuted dark:text-dark-textMuted">
                {loans.length} {loans.length === 1 ? 'loan' : 'loans'}
              </ThemedText>
            </View>

            {loans.map((loan) => (
              <LoanItem
                key={loan.id}
                loan={loan}
                currencyCode={currencyCode}
                onEdit={handleOpenEdit}
                onDelete={(l) => setDeletingLoan(l)}
                onRecordPayment={(l) => setPaymentLoan(l)}
                onTransfer={handleTransfer}
              />
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* FAB */}
      <Fab
        onPress={handleOpenAdd}
        accessibilityLabel="Add loan"
        style={{ position: 'absolute', bottom: insets.bottom + 24, right: 20 }}
      />

      {/* Modals */}
      {categoryIds && (
        <AddLoanModal
          visible={addVisible}
          onClose={() => { setAddVisible(false); setEditingLoan(null); }}
          onSuccess={() => { setAddVisible(false); setEditingLoan(null); refresh(); triggerRefresh(); }}
          editingLoan={editingLoan}
          currencyCode={currencyCode}
          categoryIds={categoryIds}
        />
      )}

      {categoryIds && (
        <RecordPaymentModal
          visible={paymentLoan !== null}
          onClose={() => setPaymentLoan(null)}
          onSuccess={() => { setPaymentLoan(null); refresh(); triggerRefresh(); }}
          loan={paymentLoan}
          currencyCode={currencyCode}
          categoryIds={categoryIds}
        />
      )}

      <DeleteConfirmSheet
        visible={deletingLoan !== null}
        loanPersonName={deletingLoan?.person_name ?? ''}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingLoan(null)}
        loading={isDeleting}
      />
    </View>
  );
}
