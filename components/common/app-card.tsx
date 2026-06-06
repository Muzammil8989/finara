import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

interface AppCardProps {
    children: React.ReactNode;
    accentColor?: string;
    className?: string;
    style?: ViewStyle;
    circleSize?: number;
    circleOffset?: number;
    onPress?: () => void;
    onLongPress?: () => void;
    androidRipple?: { color: string; borderless?: boolean };
    accessibilityRole?: React.ComponentProps<typeof Pressable>['accessibilityRole'];
    accessibilityLabel?: string;
    accessibilityHint?: string;
}

export function AppCard({
    children,
    accentColor,
    className = '',
    style,
    circleSize = 88,
    circleOffset = 24,
    onPress,
    onLongPress,
    androidRipple,
    accessibilityRole,
    accessibilityLabel,
    accessibilityHint,
}: AppCardProps) {
    const colors = useThemeColors();
    const isDark = useColorScheme() === 'dark';
    const accent = accentColor ?? colors.primary;
    const radius = circleSize / 2;

    const cardClass = `bg-backgroundAlt dark:bg-dark-backgroundAlt rounded-2xl p-4 mb-3 overflow-hidden ${className}`;

    const inner = (
        <>
            <LinearGradient
                colors={isDark
                    ? [`${accent}2A`, `${accent}10`, 'transparent']
                    : [`${accent}1C`, `${accent}08`, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                pointerEvents="none"
            />
            <View
                style={{
                    position: 'absolute',
                    top: -circleOffset,
                    right: -circleOffset,
                    width: circleSize,
                    height: circleSize,
                    borderRadius: radius,
                    backgroundColor: isDark ? `${accent}18` : `${accent}0C`,
                }}
                pointerEvents="none"
            />
            {children}
        </>
    );

    if (onPress || onLongPress) {
        return (
            <Pressable
                onPress={onPress}
                onLongPress={onLongPress}
                android_ripple={androidRipple}
                accessibilityRole={accessibilityRole}
                accessibilityLabel={accessibilityLabel}
                accessibilityHint={accessibilityHint}
                className={cardClass}
                style={style}
            >
                {inner}
            </Pressable>
        );
    }

    return (
        <View className={cardClass} style={style}>
            {inner}
        </View>
    );
}
