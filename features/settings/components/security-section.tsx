import React from 'react';

import { SettingsGroup } from './settings-group';
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
    return (
        <SettingsGroup title="Security">
            <SettingsItem
                icon="lock-closed-outline"
                title="PIN lock"
                subtitle={isSecurityEnabled ? 'Tap to remove your PIN' : 'Ask for a PIN when the app opens'}
                value={isSecurityEnabled ? 'On' : 'Off'}
                onPress={onPinPress}
                noBorder={!bioAvailable}
            />
            {bioAvailable && (
                <ToggleRow
                    icon="finger-print-outline"
                    title="Biometrics"
                    subtitle={
                        !isPinSet
                            ? 'Set a PIN first to use biometrics'
                            : bioEnabled
                                ? 'Unlock with Face ID or fingerprint'
                                : 'Off'
                    }
                    enabled={bioEnabled}
                    onToggle={onBioToggle}
                    disabled={!isPinSet}
                    noBorder
                />
            )}
        </SettingsGroup>
    );
}
