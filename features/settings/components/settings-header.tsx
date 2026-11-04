import { ScreenHeader } from '@/components/common';
import React from 'react';
import { View } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';

interface SettingsHeaderProps {
    insets: EdgeInsets;
}

export function SettingsHeader({ insets }: SettingsHeaderProps) {
    return (
        <View className="bg-background dark:bg-dark-background" style={{ paddingTop: insets.top }}>
            <ScreenHeader kicker="Preferences" title="Settings" />
        </View>
    );
}
