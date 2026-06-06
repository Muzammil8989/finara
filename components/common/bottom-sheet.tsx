import { useThemeColors } from '@/hooks/use-theme-colors';
import { LinearGradient } from 'expo-linear-gradient';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';
import { Dimensions, Modal, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedKeyboard, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const SCREEN_H = Dimensions.get('window').height;

export interface BottomSheetRef {
    dismiss: (onDone?: () => void) => void;
}

export interface BottomSheetProps {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    maxHeight?: `${number}%` | number;
    gradientColors?: readonly [string, string, ...string[]];
    paddingHorizontal?: number;
    paddingTop?: number;
    paddingBottom?: number;
    borderTopRadius?: number;
    backgroundColor?: string;
    showHandle?: boolean;
    keyboardAvoiding?: boolean;
}

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
    function BottomSheet(
        {
            visible,
            onClose,
            children,
            maxHeight = '90%',
            gradientColors,
            paddingHorizontal = 32,
            paddingTop = 48,
            paddingBottom = 64,
            borderTopRadius = 48,
            backgroundColor,
            showHandle = true,
            keyboardAvoiding = true,
        },
        ref
    ) {
        const colors = useThemeColors();
        const sheetY = useSharedValue(SCREEN_H);
        const backdropOpacity = useSharedValue(0);
        const keyboard = useAnimatedKeyboard();
        const sheetStyle = useAnimatedStyle(() => {
            const keyboardLift = keyboardAvoiding ? keyboard.height.value : 0;
            return { transform: [{ translateY: sheetY.value - keyboardLift }] };
        });
        const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

        const resolvedBg = backgroundColor ?? colors.surface;
        const resolvedGradient = gradientColors ?? ([`${colors.primary}33`, `${colors.primary}12`, 'transparent'] as const);

        const dismiss = useCallback((onDone?: () => void) => {
            sheetY.value = withTiming(SCREEN_H, { duration: 300, easing: Easing.in(Easing.cubic) });
            backdropOpacity.value = withTiming(0, { duration: 280 });
            setTimeout(() => {
                sheetY.value = SCREEN_H;
                if (onDone) { onDone(); } else { onClose(); }
            }, 320);
        // sheetY and backdropOpacity are stable Reanimated refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [onClose]);

        useImperativeHandle(ref, () => ({ dismiss }), [dismiss]);

        useEffect(() => {
            if (visible) {
                backdropOpacity.value = withTiming(1, { duration: 300 });
                sheetY.value = withSpring(0, { damping: 22, stiffness: 200, mass: 0.8 });
            }
        // sheetY and backdropOpacity are stable Reanimated refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [visible]);

        const sheet = (
            <Animated.View
                style={[
                    sheetStyle,
                    {
                        backgroundColor: resolvedBg,
                        borderTopLeftRadius: borderTopRadius,
                        borderTopRightRadius: borderTopRadius,
                        paddingHorizontal,
                        paddingTop,
                        paddingBottom,
                        maxHeight,
                        overflow: 'hidden',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 20,
                        elevation: 24,
                    },
                ]}
            >
                <LinearGradient
                    colors={resolvedGradient}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 160 }}
                />
                {showHandle && (
                    <View
                        style={{
                            width: 48,
                            height: 6,
                            backgroundColor: colors.borderStrong,
                            borderRadius: 3,
                            alignSelf: 'center',
                            marginBottom: 32,
                        }}
                    />
                )}
                {children}
            </Animated.View>
        );

        return (
            <Modal visible={visible} animationType="none" transparent statusBarTranslucent onRequestClose={() => dismiss()}>
                <View style={StyleSheet.absoluteFillObject}>
                    <Animated.View
                        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.5)' }, backdropStyle]}
                    />
                    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                        {sheet}
                    </View>
                </View>
            </Modal>
        );
    }
);
