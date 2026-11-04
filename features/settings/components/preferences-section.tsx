import { CurrencyPicker, SegmentedControl, type SegmentOption } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import React from 'react';
import { View } from 'react-native';

import { SettingsGroup } from './settings-group';
import { SettingsRowLayout } from './settings-item';
import { ToggleRow } from './toggle-row';

type ThemeMode = 'light' | 'dark' | 'system';

const THEME_SEGMENTS: readonly SegmentOption<ThemeMode>[] = [
    { key: 'light', label: 'Light', accessibilityLabel: 'Light theme' },
    { key: 'dark', label: 'Dark', accessibilityLabel: 'Dark theme' },
    { key: 'system', label: 'System', accessibilityLabel: 'Follow system theme' },
];

interface PreferencesSectionProps {
    /** The saved preference, including 'system' (not the resolved scheme). */
    theme: ThemeMode;
    currency: string;
    notifEnabled: boolean;
    onThemeSelect: (mode: ThemeMode) => void;
    onCurrencySelect: (code: string) => void;
    onNotifToggle: () => void;
}

export function PreferencesSection({
    theme,
    currency,
    notifEnabled,
    onThemeSelect,
    onCurrencySelect,
    onNotifToggle,
}: PreferencesSectionProps) {
    const colors = useThemeColors();

    return (
        <SettingsGroup title="Preferences">
            {/* Appearance: title row + segmented control, one block */}
            <View className="px-4 pb-3 border-b border-divider dark:border-dark-divider">
                <SettingsRowLayout
                    icon={theme === 'dark' ? 'moon-outline' : theme === 'light' ? 'sunny-outline' : 'phone-portrait-outline'}
                    iconColor={colors.textSecondary}
                    title="Appearance"
                    noBorder
                />
                <SegmentedControl options={THEME_SEGMENTS} value={theme} onChange={onThemeSelect} className="ml-10" />
            </View>

            <View className="border-b border-divider dark:border-dark-divider">
                <CurrencyPicker value={currency} onSelect={onCurrencySelect} variant="row" />
            </View>

            <ToggleRow
                icon="notifications-outline"
                title="Daily reminder"
                subtitle={notifEnabled ? 'Every day at 9 PM' : 'Off'}
                enabled={notifEnabled}
                onToggle={onNotifToggle}
                noBorder
            />
        </SettingsGroup>
    );
}
