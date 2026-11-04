import { AddBudgetModal } from '@/features/budgets/components/add-budget-modal';
import { ExportSheet } from '@/features/export/components/export-sheet';
import { AddTransactionModal } from '@/features/transactions/components/add-transaction-modal';
import { CustomTabBar, GlobalFab } from '@/components/layouts';
import { useModals } from '@/providers/modal-context';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function TabLayout() {
  const { activeModal, transactionInitialType, editingBudget, closeModal, triggerRefresh } = useModals();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}>
        <Tabs.Screen name="index" options={{ title: 'Overview' }} />
        <Tabs.Screen name="transactions" options={{ title: 'Activity' }} />
        <Tabs.Screen name="budget" options={{ title: 'Budgets' }} />
        <Tabs.Screen name="savings" options={{ title: 'Savings' }} />
        <Tabs.Screen name="reports" options={{ title: 'Insights' }} />
      </Tabs>
      <GlobalFab />

      <AddTransactionModal
        visible={activeModal === 'transaction'}
        onClose={closeModal}
        onSuccess={() => {
          triggerRefresh();
          closeModal();
        }}
        initialType={transactionInitialType}
      />
      {/* One budget sheet for add and edit — Budgets passes the edit target through openModal. */}
      <AddBudgetModal
        visible={activeModal === 'budget'}
        editBudget={editingBudget}
        onClose={closeModal}
        onSuccess={() => {
          triggerRefresh();
          closeModal();
        }}
      />
      <ExportSheet visible={activeModal === 'export'} onClose={closeModal} />
    </View>
  );
}
