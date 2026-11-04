import { type Href, router } from 'expo-router';
import React from 'react';

import { SettingsGroup } from './settings-group';
import { SettingsItem } from './settings-item';

export function ManagementSection() {
    return (
        <SettingsGroup title="Manage">
            <SettingsItem
                icon="pricetags-outline"
                title="Categories"
                subtitle="Spending and income categories"
                onPress={() => router.push('/categories' as Href)}
            />
            <SettingsItem
                icon="card-outline"
                title="Accounts"
                subtitle="Wallets, cards and bank accounts"
                onPress={() => router.push('/payment-methods' as Href)}
            />
            <SettingsItem
                icon="repeat-outline"
                title="Bills & subscriptions"
                subtitle="Recurring payments"
                onPress={() => router.push('/recurring' as Href)}
            />
            <SettingsItem
                icon="home-outline"
                title="Household budget"
                subtitle="Track home expenses separately"
                onPress={() => router.push('/household' as Href)}
            />
            <SettingsItem
                icon="swap-horizontal-outline"
                title="Loans"
                subtitle="Money lent and borrowed"
                onPress={() => router.push('/loans' as Href)}
                noBorder
            />
        </SettingsGroup>
    );
}
