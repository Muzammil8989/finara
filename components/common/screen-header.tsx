import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Pressable } from './pressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from './themed-text';

export interface ScreenHeaderProps {
    title: string;
    /** One muted line under the title. */
    subtitle?: string;
    /** Small uppercase line above the title, e.g. "NOVEMBER 2026". */
    kicker?: string;
    onBack?: () => void;
    /** Hide the back chevron — tab screens are roots and have nothing to go back to. */
    showBack?: boolean;
    right?: React.ReactNode;
    /** Add safe-area top padding to the header itself (use when header is NOT inside a SafeArea-padded ScrollView) */
    withInsets?: boolean;
    /** Show a hairline rule under the header */
    border?: boolean;
}

/**
 * The one header for every screen.
 *
 * Tab screens:   <ScreenHeader showBack={false} kicker="NOVEMBER 2026" title="Budgets" right={…} />
 * Stack screens: <ScreenHeader title="Loans" subtitle="2 open" />
 */
export function ScreenHeader({
    title,
    subtitle,
    kicker,
    onBack,
    showBack = true,
    right,
    withInsets = false,
    border = false,
}: ScreenHeaderProps) {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();

    return (
        <View
            className={`px-5 pb-4${border ? ' border-b border-divider dark:border-dark-divider' : ''}`}
            style={{ paddingTop: withInsets ? insets.top + 12 : 16 }}
        >
            {showBack && (
                <Pressable
                    onPress={onBack ?? (() => router.back())}
                    className="w-11 h-11 -ml-3 mb-1 items-center justify-center rounded-full"
                    hitSlop={4}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                >
                    <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
                </Pressable>
            )}

            <View className="flex-row items-end">
                <View className="flex-1">
                    {!!kicker && (
                        <ThemedText type="kicker" className="mb-1" numberOfLines={1}>
                            {kicker}
                        </ThemedText>
                    )}
                    <ThemedText type="headline" className="text-[28px] leading-[34px]" numberOfLines={1} accessibilityRole="header">
                        {title}
                    </ThemedText>
                    {subtitle ? (
                        <ThemedText type="caption" className="mt-1" numberOfLines={1}>
                            {subtitle}
                        </ThemedText>
                    ) : null}
                </View>

                {right ? <View className="ml-3 flex-row items-center">{right}</View> : null}
            </View>
        </View>
    );
}

/** Round 44px icon button for header right slots. */
export function HeaderIconButton({
    icon,
    onPress,
    accessibilityLabel,
}: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    onPress: () => void;
    accessibilityLabel: string;
}) {
    const colors = useThemeColors();
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            className="w-11 h-11 rounded-full items-center justify-center border border-divider dark:border-dark-divider"
            style={({ pressed }) => ({ backgroundColor: pressed ? colors.backgroundAlt : 'transparent' })}
        >
            <Ionicons name={icon} size={20} color={colors.textPrimary} />
        </Pressable>
    );
}
