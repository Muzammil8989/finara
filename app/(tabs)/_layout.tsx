import { AddBudgetModal } from '@/features/budgets/components/add-budget-modal';
import { AddTransactionModal } from '@/features/transactions/components/add-transaction-modal';
import { CustomTabBar, GlobalFab } from '@/components/layouts';
import { useModals } from '@/context/modal-context';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function TabLayout() {
  const { activeModal, transactionInitialType, closeModal, triggerRefresh } = useModals();

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
      <AddBudgetModal
        visible={activeModal === 'budget'}
        onClose={closeModal}
        onSuccess={() => {
          triggerRefresh();
          closeModal();
        }}
      />
    </View>
  );
}
