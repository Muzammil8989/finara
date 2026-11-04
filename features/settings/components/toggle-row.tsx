import { useThemeColors } from '@/hooks/use-theme-colors';
import { IoniconsName } from '@/types';
import React from 'react';
import { Switch } from 'react-native';
import { Pressable } from '@/components/common/pressable';
import { SettingsRowLayout } from './settings-item';

interface ToggleRowProps {
    icon: IoniconsName;
    /** @deprecated kept for backward compat; ignored. */
    iconBgColor?: string;
    iconColor?: string;
    title: string;
    subtitle?: string;
    enabled: boolean;
    onToggle: () => void;
    noBorder?: boolean;
    disabled?: boolean;
}

/** A settings row with a switch. The whole row is tappable. */
export function ToggleRow({
    icon,
    iconColor,
    title,
    subtitle,
    enabled,
    onToggle,
    noBorder = false,
    disabled = false,
}: ToggleRowProps) {
    const colors = useThemeColors();

    return (
        <Pressable
            onPress={disabled ? undefined : onToggle}
            accessibilityRole="switch"
            accessibilityLabel={title}
            accessibilityHint={subtitle}
            accessibilityState={{ checked: enabled, disabled }}
            className="px-4"
            style={({ pressed }) => ({
                backgroundColor: pressed && !disabled ? colors.backgroundAlt : 'transparent',
                opacity: disabled ? 0.5 : 1,
            })}
        >
            <SettingsRowLayout
                icon={icon}
                iconColor={iconColor ?? colors.textSecondary}
                title={title}
                subtitle={subtitle}
                noBorder={noBorder}
            >
                <Switch
                    value={enabled}
                    onValueChange={onToggle}
                    disabled={disabled}
                    trackColor={{ false: colors.borderStrong, true: colors.primary }}
                    thumbColor="#FFFFFF"
                    // The row already announces the switch; avoid a duplicate stop.
                    importantForAccessibility="no-hide-descendants"
                    accessibilityElementsHidden
                />
            </SettingsRowLayout>
        </Pressable>
    );
}
