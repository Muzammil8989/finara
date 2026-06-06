import { ThemedText } from '@/components/common';
import { type Href, router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { SettingsItem } from './settings-item';

export function ManagementSection() {
    return (
        <View className="mb-8">
            <ThemedText className="mb-4 text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted">
                Management
            </ThemedText>
            <View className="bg-backgroundAlt dark:bg-dark-backgroundAlt rounded-3xl overflow-hidden">
                <SettingsItem
                    icon="folder-outline"
                    title="Categories"
                    subtitle="Manage spending categories"
                    onPress={() => router.push('/categories' as Href)}
                />
                <SettingsItem
                    icon="card-outline"
                    title="Accounts & Wallets"
                    subtitle="Manage your payment methods"
                    onPress={() => router.push('/payment-methods' as Href)}
                />
                <SettingsItem
                    icon="repeat-outline"
                    title="Subscriptions & Bills"
                    subtitle="Manage recurring transactions"
                    onPress={() => router.push('/recurring' as Href)}
                />
                <SettingsItem
                    icon="home-outline"
                    title="Household Budget"
                    subtitle="Track home expenses separately"
                    onPress={() => router.push('/household' as Href)}
                />
                <SettingsItem
                    icon="cash-outline"
                    title="Loans & Borrowings"
                    subtitle="Track money given and taken"
                    onPress={() => router.push('/loans' as Href)}
                    noBorder
                />
            </View>
        </View>
    );
}
