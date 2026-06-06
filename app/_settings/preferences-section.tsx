import { CurrencyPicker, ThemedText } from '@/components/common';
import React from 'react';
import { View } from 'react-native';

import { ThemeDropdown } from './theme-dropdown';
import { ToggleRow } from './toggle-row';

interface PreferencesSectionProps {
    colorScheme: 'light' | 'dark';
    currency: string;
    notifEnabled: boolean;
    onThemeSelect: (mode: 'light' | 'dark' | 'system') => void;
    onCurrencySelect: (code: string) => void;
    onNotifToggle: () => void;
}

export function PreferencesSection({
    colorScheme,
    currency,
    notifEnabled,
    onThemeSelect,
    onCurrencySelect,
    onNotifToggle,
}: PreferencesSectionProps) {
    return (
        <View>
            <ThemedText className="mb-4 text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted">
                App Preferences
            </ThemedText>

            <ThemeDropdown
                currentScheme={colorScheme}
                onSelect={onThemeSelect}
            />

            <View className="mb-8 z-10">
                <CurrencyPicker
                    value={currency}
                    onSelect={onCurrencySelect}
                />
            </View>

            <View className="bg-backgroundAlt dark:bg-dark-backgroundAlt rounded-3xl overflow-hidden mb-8">
                <ToggleRow
                    icon="notifications-outline"
                    title="Notifications"
                    subtitle={notifEnabled ? 'Daily reminder at 9 PM' : 'Off'}
                    enabled={notifEnabled}
                    onToggle={onNotifToggle}
                    noBorder
                />
            </View>
        </View>
    );
}
