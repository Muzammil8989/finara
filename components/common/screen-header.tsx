import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from './themed-text';

export interface ScreenHeaderProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    right?: React.ReactNode;
    /** Add safe-area top padding to the header itself (use when header is NOT inside a SafeArea-padded ScrollView) */
    withInsets?: boolean;
    /** Show a thin bottom border separator */
    border?: boolean;
}

export function ScreenHeader({ title, subtitle, onBack, right, withInsets = false, border = false }: ScreenHeaderProps) {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();

    return (
        <View
            className={`flex-row items-center px-5 pb-4${border ? ' border-b border-divider dark:border-dark-divider' : ''}`}
            style={{ paddingTop: withInsets ? insets.top + 12 : 16 }}
        >
            <Pressable
                onPress={onBack ?? (() => router.back())}
                className="w-10 h-10 items-center justify-center mr-3"
                hitSlop={8}
            >
                <Ionicons name="chevron-back" size={22} color={colors.primary} />
            </Pressable>

            <View className="flex-1">
                <ThemedText className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary" numberOfLines={1}>
                    {title}
                </ThemedText>
                {subtitle ? (
                    <ThemedText className="text-xs text-textMuted dark:text-dark-textMuted mt-0.5" numberOfLines={1}>
                        {subtitle}
                    </ThemedText>
                ) : null}
            </View>

            {right ? (
                <View className="ml-3">{right}</View>
            ) : null}
        </View>
    );
}
