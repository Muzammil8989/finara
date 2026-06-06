import { ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

interface SettingsItemProps {
    icon: IoniconsName;
    iconBgColor?: string; // kept for backward compat, unused
    iconColor?: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showChevron?: boolean;
    noBorder?: boolean;
}

export function SettingsItem({
    icon,
    iconBgColor,
    iconColor,
    title,
    subtitle,
    onPress,
    rightElement,
    showChevron = true,
    noBorder = false,
}: SettingsItemProps) {
    const colors = useThemeColors();
    const fgColor = iconColor ?? colors.primary;

    return (
        <Pressable
            onPress={onPress}
            className={`flex-row items-center p-5 ${!noBorder ? 'border-b border-divider dark:border-dark-divider' : ''}`}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
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
            {rightElement ?? (showChevron && (
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            ))}
        </Pressable>
    );
}
