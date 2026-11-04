import { type Href, router } from 'expo-router';
import React from 'react';

import { SettingsGroup } from './settings-group';
import { SettingsItem } from './settings-item';

export function LegalSection() {
    return (
        <SettingsGroup title="Legal">
            <SettingsItem
                icon="document-text-outline"
                title="Terms of use"
                subtitle="Usage rules and disclaimers"
                onPress={() => router.push('/terms' as Href)}
            />
            <SettingsItem
                icon="shield-checkmark-outline"
                title="Privacy policy"
                subtitle="How your data is handled"
                onPress={() => router.push('/privacy' as Href)}
                noBorder
            />
        </SettingsGroup>
    );
}
