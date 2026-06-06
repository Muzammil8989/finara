import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { DimensionValue, LayoutChangeEvent, View, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

interface SkeletonProps {
    width?: DimensionValue;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
    const [containerWidth, setContainerWidth] = useState(300);
    const shimmer = useSharedValue(0);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const baseColor = isDark ? '#1A2235' : '#E8ECF0';
    const shineColor = isDark ? '#253047' : '#F4F7FA';

    useEffect(() => {
        shimmer.value = withRepeat(
            withTiming(1, { duration: 1200, easing: Easing.linear }),
            -1,
            false,
        );
    }, [shimmer]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-containerWidth, containerWidth]) }],
    }));

    const onLayout = (e: LayoutChangeEvent) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setContainerWidth(w);
    };

    return (
        <View
            onLayout={onLayout}
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: baseColor,
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            <Animated.View
                style={[
                    { position: 'absolute', top: 0, bottom: 0, width: containerWidth },
                    animatedStyle,
                ]}
            >
                <LinearGradient
                    colors={[baseColor, shineColor, baseColor]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                />
            </Animated.View>
        </View>
    );
}
