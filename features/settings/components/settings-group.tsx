import { ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import React from 'react';
import { View } from 'react-native';

interface SettingsGroupProps {
    title: string;
    /** Small helper text under the group. */
    footer?: string;
    /** 'danger' tints the title and border for destructive actions. */
    tone?: 'default' | 'danger';
    children: React.ReactNode;
}

/**
 * One block of settings: kicker title, then rows in a single ruled card.
 * Every section on the Settings screen uses this, so spacing and edges line up.
 */
export function SettingsGroup({ title, footer, tone = 'default', children }: SettingsGroupProps) {
    const colors = useThemeColors();
    const danger = tone === 'danger';

    return (
        <View className="mb-7">
            <ThemedText type="kicker" className="mb-2" style={danger ? { color: colors.expense } : undefined}>
                {title}
            </ThemedText>
            <View
                className="rounded-xl overflow-hidden border"
                style={{
                    backgroundColor: colors.surface,
                    borderColor: danger ? colors.errorBorder : colors.divider,
                }}
            >
                {children}
            </View>
            {!!footer && (
                <ThemedText type="caption" className="mt-2">
                    {footer}
                </ThemedText>
            )}
        </View>
    );
}
