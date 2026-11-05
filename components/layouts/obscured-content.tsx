import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

/**
 * Wraps app content that may sit underneath the lock screen or privacy cover.
 * Those overlays only cover it visually: without this, TalkBack / VoiceOver
 * can still swipe to (and activate) everything behind them.
 */
export function ObscuredContent({
    hidden,
    style,
    children,
}: {
    hidden: boolean;
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
}) {
    return (
        <View
            style={style}
            accessibilityElementsHidden={hidden}
            importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
            testID="obscured-content"
        >
            {children}
        </View>
    );
}
