import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { Pressable } from './pressable';

interface AppCardProps {
    children: React.ReactNode;
    /** Draws a 3px accent rule on the card's left edge. */
    accentColor?: string;
    className?: string;
    style?: ViewStyle;
    /** @deprecated decorative circle removed in the editorial redesign; ignored. */
    circleSize?: number;
    /** @deprecated ignored. */
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
    onPress,
    onLongPress,
    androidRipple,
    accessibilityRole,
    accessibilityLabel,
    accessibilityHint,
}: AppCardProps) {
    const cardClass = `bg-surface dark:bg-dark-surface border border-divider dark:border-dark-divider rounded-xl p-4 mb-3 overflow-hidden ${className}`;

    const inner = (
        <>
            {!!accentColor && (
                <View
                    style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: accentColor }}
                    pointerEvents="none"
                />
            )}
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
                style={({ pressed }) => [style, pressed && { opacity: 0.85 }]}
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
