import { ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

interface ToggleRowProps {
    icon: IoniconsName;
    iconBgColor?: string; // kept for backward compat, unused
    iconColor?: string;
    title: string;
    subtitle?: string;
    enabled: boolean;
    onToggle: () => void;
    noBorder?: boolean;
    disabled?: boolean;
}

export function ToggleRow({
    icon,
    iconBgColor,
    iconColor,
    title,
    subtitle,
    enabled,
    onToggle,
    noBorder = false,
    disabled = false,
}: ToggleRowProps) {
    const colors = useThemeColors();
    const fgColor = iconColor ?? colors.primary;

    return (
        <Pressable
            onPress={disabled ? undefined : onToggle}
            className={`flex-row items-center p-5 ${!noBorder ? 'border-b border-divider dark:border-dark-divider' : ''}`}
            style={({ pressed }) => ({ opacity: disabled ? 0.4 : pressed ? 0.7 : 1 })}
            accessibilityRole="switch"
            accessibilityState={{ checked: enabled, disabled }}
        >
            <View className="w-10 h-10 rounded-xl items-center justify-center mr-4">
                <Ionicons name={icon} size={20} color={fgColor} />
            </View>
            <View className="flex-1">
                <ThemedText className="text-base font-semibold text-textPrimary dark:text-dark-textPrimary">
                    {title}
                </ThemedText>
                {subtitle && (
                    <ThemedText className="text-sm text-textMuted dark:text-dark-textMuted mt-0.5">
                        {subtitle}
                    </ThemedText>
                )}
            </View>

            {/* Toggle pill */}
            <View
                className="w-12 h-6 rounded-full px-1 justify-center"
                style={{ backgroundColor: enabled && !disabled ? colors.primary : colors.borderStrong }}
            >
                <View
                    className="w-4 h-4 rounded-full bg-white"
                    style={{ alignSelf: enabled && !disabled ? 'flex-end' : 'flex-start' }}
                />
            </View>
        </Pressable>
    );
}
