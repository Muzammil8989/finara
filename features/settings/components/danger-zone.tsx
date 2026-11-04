import React from 'react';

import { SettingsGroup } from './settings-group';
import { SettingsItem } from './settings-item';

interface DangerZoneProps {
    onFactoryReset: () => void;
}

export function DangerZone({ onFactoryReset }: DangerZoneProps) {
    return (
        <SettingsGroup
            title="Danger zone"
            tone="danger"
            footer="Deletes every transaction, budget, goal, your profile and PIN. This cannot be undone."
        >
            <SettingsItem
                icon="trash-outline"
                title="Factory reset"
                subtitle="Erase all data on this device"
                onPress={onFactoryReset}
                destructive
                noBorder
            />
        </SettingsGroup>
    );
}
