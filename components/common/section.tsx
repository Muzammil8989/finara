import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { ThemedText } from './themed-text';

/** A hairline horizontal rule. */
export function Rule({ className = '', strong = false }: { className?: string; strong?: boolean }) {
    return (
        <View
            className={`${strong ? 'h-[2px] bg-textPrimary dark:bg-dark-textPrimary' : 'h-px bg-divider dark:bg-dark-divider'} ${className}`}
        />
    );
}

interface SectionProps {
    title: string;
    kicker?: string;
    /** Right-aligned link, e.g. "See all". */
    actionLabel?: string;
    onAction?: () => void;
    children: React.ReactNode;
    className?: string;
    style?: ViewStyle;
    /** Draw the rule above the heading (default true). */
    ruled?: boolean;
}

/**
 * Editorial content block: hairline rule, kicker + serif title, optional link,
 * then the content. Use instead of wrapping everything in a card.
 */
export function Section({
    title,
    kicker,
    actionLabel,
    onAction,
    children,
    className = '',
    style,
    ruled = true,
}: SectionProps) {
    const colors = useThemeColors();
    return (
        <View className={`px-5 mt-7 ${className}`} style={style}>
            {ruled && <Rule className="mb-4" />}
            <View className="flex-row items-end justify-between mb-3">
                <View className="flex-1">
                    {!!kicker && <ThemedText type="kicker" className="mb-1">{kicker}</ThemedText>}
                    <ThemedText type="headline" className="text-xl leading-7" accessibilityRole="header">{title}</ThemedText>
                </View>
                {!!actionLabel && !!onAction && (
                    <Pressable
                        onPress={onAction}
                        hitSlop={10}
                        accessibilityRole="link"
                        accessibilityLabel={actionLabel}
                        className="flex-row items-center min-h-[44px] pl-3"
                    >
                        <ThemedText type="label" style={{ color: colors.primary }}>{actionLabel}</ThemedText>
                        <Ionicons name="arrow-forward" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                    </Pressable>
                )}
            </View>
            {children}
        </View>
    );
}
