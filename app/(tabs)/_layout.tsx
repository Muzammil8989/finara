import { AddBudgetModal } from '@/features/budgets/components/add-budget-modal';
import { ExportSheet } from '@/features/export/components/export-sheet';
import { AddTransactionModal } from '@/features/transactions/components/add-transaction-modal';
import { CustomTabBar, GlobalFab } from '@/components/layouts';
import { useModals } from '@/providers/modal-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

const renderTabBar = (props: BottomTabBarProps) => <CustomTabBar {...props} />;

const SCREEN_OPTIONS = {
  headerShown: false,
  animation: 'none',
  // Hidden tabs don't re-render in the background; queued refreshes apply when the tab is shown again.
  freezeOnBlur: true,
} as const;

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs tabBar={renderTabBar} screenOptions={SCREEN_OPTIONS}>
        <Tabs.Screen name="index" options={{ title: 'Overview' }} />
        <Tabs.Screen name="transactions" options={{ title: 'Activity' }} />
        <Tabs.Screen name="budget" options={{ title: 'Budgets' }} />
        <Tabs.Screen name="savings" options={{ title: 'Savings' }} />
        <Tabs.Screen name="reports" options={{ title: 'Insights' }} />
      </Tabs>
      <GlobalFab />
      <TabModals />
    </View>
  );
}

/**
 * Global sheets opened from the FAB. Kept in their own component so opening or
 * closing one re-renders only this subtree, not the tab navigator.
 */
function TabModals() {
  const { activeModal, transactionInitialType, editingBudget, closeModal, triggerRefresh } = useModals();

  return (
    <>
      {/* Kept mounted so accounts/categories are already loaded when the sheet opens. */}
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
          triggerRefresh(['budgets']);
          closeModal();
        }}
      />
      {/* Rarely used: mounted only while open. */}
      {activeModal === 'export' && <ExportSheet visible onClose={closeModal} />}
    </>
  );
}
