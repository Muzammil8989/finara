import { useThemeColors } from '@/hooks/use-theme-colors';
import React, { useEffect } from 'react';
import { DimensionValue, ViewStyle } from 'react-native';
import Animated, {
    cancelAnimation,
    Easing,
    makeMutable,
    useAnimatedStyle,
    useReducedMotion,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

interface SkeletonProps {
    width?: DimensionValue;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

/**
 * One pulse shared by every skeleton on screen. Loading states mount 30+
 * skeletons at once; one animation (instead of one looping gradient each) keeps
 * low-end devices smooth and keeps the placeholders in sync. It runs only while
 * at least one skeleton is mounted.
 */
const pulse = makeMutable(0);
let mountedCount = 0;

function startPulse() {
    mountedCount += 1;
    if (mountedCount === 1) {
        pulse.value = 0;
        pulse.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }), -1, true);
    }
}

function stopPulse() {
    mountedCount = Math.max(0, mountedCount - 1);
    if (mountedCount === 0) cancelAnimation(pulse);
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
    const colors = useThemeColors();
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        if (reduceMotion) return;
        startPulse();
        return stopPulse;
    }, [reduceMotion]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: reduceMotion ? 1 : 1 - pulse.value * 0.45,
    }));

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: colors.backgroundAlt,
                },
                style,
                animatedStyle,
            ]}
        />
    );
}
