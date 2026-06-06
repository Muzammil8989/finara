import { ThemedText } from '@/components/common';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { typography } from '@/theme/typography';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';

interface SettingsHeaderProps {
    insets: EdgeInsets;
}

export function SettingsHeader({ insets }: SettingsHeaderProps) {
    const colors = useThemeColors();
    const colorScheme = useColorScheme();

    const headerGradient = colorScheme === 'dark'
        ? [`${colors.primary}24`, `${colors.primary}0F`, 'transparent'] as const
        : [`${colors.primary}12`, `${colors.primary}05`, 'transparent'] as const;

    return (
        <View className="bg-background dark:bg-dark-background">
            <View
                style={{ paddingTop: insets.top }}
                className="px-5 pt-5 pb-4 overflow-hidden"
            >
                <LinearGradient
                    colors={headerGradient}
                    className="absolute top-0 left-0 right-0 bottom-0"
                />
                <ThemedText
                    className="font-semibold tracking-tight mb-1"
                    style={{ fontSize: typography.fontSizes['2xl'] }}
                >
                    Settings
                </ThemedText>
                <ThemedText
                    className="text-sm"
                    style={{ color: colors.textMuted }}
                >
                    Manage your preferences
                </ThemedText>
            </View>
        </View>
    );
}
