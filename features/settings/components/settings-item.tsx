import { ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { Pressable } from '@/components/common/pressable';

interface SettingsItemProps {
    icon: IoniconsName;
    /** @deprecated kept for backward compat; ignored. */
    iconBgColor?: string;
    iconColor?: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    /** Short value shown on the right, e.g. "On" or "Export". */
    value?: string;
    showChevron?: boolean;
    noBorder?: boolean;
    disabled?: boolean;
    /** Red title and icon for destructive actions. */
    destructive?: boolean;
}

/**
 * A single settings row:  [icon]  Title / subtitle  ……  value ›
 * Same padding, icon column and type scale everywhere on the Settings screen.
 */
export function SettingsItem({
    icon,
    iconColor,
    title,
    subtitle,
    onPress,
    rightElement,
    value,
    showChevron = true,
    noBorder = false,
    disabled = false,
    destructive = false,
}: SettingsItemProps) {
    const colors = useThemeColors();
    const fg = destructive ? colors.expense : iconColor ?? colors.textSecondary;

    return (
        <Pressable
            onPress={disabled ? undefined : onPress}
            disabled={disabled || !onPress}
            accessibilityRole={onPress ? 'button' : undefined}
            accessibilityLabel={[title, subtitle, value].filter(Boolean).join(', ')}
            accessibilityState={{ disabled }}
            className="px-4"
            style={({ pressed }) => ({
                backgroundColor: pressed && onPress ? colors.backgroundAlt : 'transparent',
                opacity: disabled ? 0.5 : 1,
            })}
        >
            <SettingsRowLayout
                icon={icon}
                iconColor={fg}
                title={title}
                titleColor={destructive ? colors.expense : undefined}
                subtitle={subtitle}
                noBorder={noBorder}
            >
                {rightElement ?? (
                    <View className="flex-row items-center">
                        {!!value && (
                            <ThemedText type="label" className="mr-1" style={{ color: colors.textSecondary }}>
                                {value}
                            </ThemedText>
                        )}
                        {showChevron && (
                            <Ionicons name="chevron-forward" size={18} color={destructive ? colors.expense : colors.textMuted} />
                        )}
                    </View>
                )}
            </SettingsRowLayout>
        </Pressable>
    );
}

/** Shared inner layout for SettingsItem and ToggleRow. */
export function SettingsRowLayout({
    icon,
    iconColor,
    title,
    titleColor,
    subtitle,
    noBorder,
    children,
}: {
    icon: IoniconsName;
    iconColor: string;
    title: string;
    titleColor?: string;
    subtitle?: string;
    noBorder?: boolean;
    children?: React.ReactNode;
}) {
    return (
        <View
            className={`flex-row items-center min-h-[60px] py-3 ${noBorder ? '' : 'border-b border-divider dark:border-dark-divider'}`}
        >
            <View className="w-7 mr-3 items-center">
                <Ionicons name={icon} size={20} color={iconColor} />
            </View>
            <View className="flex-1 mr-3">
                <ThemedText
                    type="defaultSemiBold"
                    className="text-[15px] leading-5"
                    style={titleColor ? { color: titleColor } : undefined}
                    numberOfLines={1}
                >
                    {title}
                </ThemedText>
                {!!subtitle && (
                    <ThemedText type="caption" className="mt-0.5" numberOfLines={2}>
                        {subtitle}
                    </ThemedText>
                )}
            </View>
            {children}
        </View>
    );
}
