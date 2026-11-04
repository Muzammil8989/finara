import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Pressable as RNPressable, StyleSheet, type ViewStyle } from 'react-native';

export const FAB_SIZE = 56;

interface FabProps {
    onPress: () => void;
    accessibilityLabel: string;
    disabled?: boolean;
    /** Positioning (absolute bottom/right) is the caller's job. */
    style?: ViewStyle;
    testID?: string;
}

/** The one floating "+" button style used across the app. */
export function Fab({ onPress, accessibilityLabel, disabled = false, style, testID }: FabProps) {
    const colors = useThemeColors();
    const [pressed, setPressed] = useState(false);
    // Static styles only: the circle's colour never depends on a style function.
    const fill = disabled ? colors.btnDisabledBg : pressed ? colors.btnPrimaryBgPressed : colors.btnPrimaryBg;

    return (
        <RNPressable
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ disabled }}
            disabled={disabled}
            hitSlop={4}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onPress();
            }}
            style={[styles.fab, { backgroundColor: fill, elevation: disabled ? 0 : 6, shadowOpacity: disabled ? 0 : 0.2 }, style]}
        >
            <Ionicons name="add" size={28} color={disabled ? colors.btnDisabledText : colors.btnPrimaryText} />
        </RNPressable>
    );
}

const styles = StyleSheet.create({
    fab: {
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        // A single soft ink shadow — no coloured glow
        shadowColor: '#1A1714',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        zIndex: 100,
    },
});
