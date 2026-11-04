import React, { forwardRef, useState } from 'react';
import {
    Pressable as RNPressable,
    type GestureResponderEvent,
    type PressableProps as RNPressableProps,
    type View,
} from 'react-native';

export type PressableProps = RNPressableProps & { className?: string };

/**
 * Drop-in replacement for React Native's Pressable that supports
 * `style={({ pressed }) => …}`.
 *
 * NativeWind wraps every RN Pressable and treats `style` as a style object;
 * a style *function* is silently dropped on device, so anything that put its
 * size or background there (the FAB, chip borders, pressed states) rendered
 * unstyled. Here the function is resolved first and a plain style is passed on.
 */
export const Pressable = forwardRef<View, PressableProps>(function Pressable(
    { style, onPressIn, onPressOut, ...rest },
    ref,
) {
    const [pressed, setPressed] = useState(false);
    const isFn = typeof style === 'function';
    // A variable, not an inline literal: with Expo's generated expo-env.d.ts
    // (gitignored, so absent in CI) `hovered` is required; without it, it is
    // an unknown key that an inline literal would reject.
    const state = { pressed, hovered: false };

    return (
        <RNPressable
            ref={ref}
            {...rest}
            style={isFn ? style(state) : style}
            onPressIn={(e: GestureResponderEvent) => {
                if (isFn) setPressed(true);
                onPressIn?.(e);
            }}
            onPressOut={(e: GestureResponderEvent) => {
                if (isFn) setPressed(false);
                onPressOut?.(e);
            }}
        />
    );
});
