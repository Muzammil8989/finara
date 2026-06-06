import { ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import React from 'react';
import { View } from 'react-native';

import { SettingsItem } from './settings-item';
import { ToggleRow } from './toggle-row';

interface SecuritySectionProps {
    isSecurityEnabled: boolean;
    isPinSet: boolean;
    bioAvailable: boolean;
    bioEnabled: boolean;
    onPinPress: () => void;
    onBioToggle: () => void;
}

export function SecuritySection({
    isSecurityEnabled,
    isPinSet,
    bioAvailable,
    bioEnabled,
    onPinPress,
    onBioToggle,
}: SecuritySectionProps) {
    const colors = useThemeColors();

    return (
        <View className="mb-8">
            <ThemedText className="mb-4 text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted">
                Security
            </ThemedText>
            <View className="bg-backgroundAlt dark:bg-dark-backgroundAlt rounded-3xl overflow-hidden">
                <SettingsItem
                    icon="lock-closed-outline"
                    iconBgColor={`${colors.warning}18`}
                    iconColor={colors.warning}
                    title="PIN Security"
                    subtitle={isSecurityEnabled ? 'Tap to remove PIN' : 'Tap to set up PIN security'}
                    onPress={onPinPress}
                    showChevron={!isSecurityEnabled}
                    rightElement={isSecurityEnabled ? (
                        <View style={{ backgroundColor: `${colors.success}15`, borderRadius: 8, padding: 4 }}>
                            <ThemedText className="text-[10px] font-bold px-1" style={{ color: colors.success }}>ON</ThemedText>
                        </View>
                    ) : undefined}
                    noBorder={!bioAvailable}
                />
                {bioAvailable && (
                    <ToggleRow
                        icon="finger-print-outline"
                        iconBgColor={`${colors.success}18`}
                        iconColor={colors.success}
                        title="Biometrics"
                        subtitle={
                            !isPinSet
                                ? 'Set a PIN first to enable biometrics'
                                : bioEnabled
                                    ? 'Face ID / Fingerprint enabled'
                                    : 'Off'
                        }
                        enabled={bioEnabled}
                        onToggle={onBioToggle}
                        disabled={!isPinSet}
                        noBorder
                    />
                )}
            </View>
        </View>
    );
}
