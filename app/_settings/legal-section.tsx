import { ThemedText } from '@/components/common';
import { type Href, router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { SettingsItem } from './settings-item';

export function LegalSection() {
    return (
        <View className="mb-8">
            <ThemedText className="mb-4 text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted">
                Legal
            </ThemedText>
            <View className="bg-backgroundAlt dark:bg-dark-backgroundAlt rounded-3xl overflow-hidden">
                <SettingsItem
                    icon="document-text-outline"
                    title="Terms of Use"
                    subtitle="Usage rules and disclaimers"
                    onPress={() => router.push('/terms' as Href)}
                />
                <SettingsItem
                    icon="shield-checkmark-outline"
                    title="Privacy Policy"
                    subtitle="How your data is handled"
                    onPress={() => router.push('/privacy' as Href)}
                    noBorder
                />
            </View>
        </View>
    );
}
