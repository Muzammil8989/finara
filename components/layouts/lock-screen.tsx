/**
 * LockScreen — PIN entry screen shown when the app is locked.
 *
 * Design token usage:
 *   background    → bg-background / dark:bg-dark-background
 *   number button → bg-surface / dark:bg-dark-surface + border-borderSoft
 *   bio button    → bg-brand-primary/5   (primary tonal surface Level 1)
 *   logo badge    → bg-brand-primary/10  (primary tonal surface Level 2)
 *   number text   → ThemedText (textPrimary / dark-textPrimary)
 *   subtitle      → text-textMuted / dark:text-dark-textMuted  (NOT opacity-40)
 *   forgot PIN    → ThemedText type="link"  (primary color, full opacity)
 *
 * M3 State Layer:
 *   Buttons use Pressable children-as-function with an absolute overlay View
 *   backgroundColor = rgba(13,92,99,0.12) = primary at 12% (pressed state)
 *   NOT active:opacity-60 which changes the whole element's transparency
 */

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { memo, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useAuth } from '@/features/auth/context/auth-context';
import { useUser } from '@/features/user/context/user-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { shadows } from '@/theme/shadows';
import { useFactoryReset } from '@/features/auth/hooks/use-factory-reset';
import { logger } from '@/lib/logger';
import { SecurityService } from '@/features/auth/services/security-service';
import { IconSymbol, ThemedText } from '@/components/common';

// M3 primary at 12% — pressed State Layer color (all platforms)
const STATE_LAYER_COLOR = 'rgba(13,92,99,0.12)';

// ─── NumberButton ─────────────────────────────────────────────────────────────

const NumberButton = memo(({ value, index, onPress }: {
    value: string;
    index: number;
    onPress: (v: string) => void;
}) => (
    <Animated.View entering={FadeInDown.delay(300 + index * 20).duration(500).springify().damping(18)}>
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress(value);
            }}
            className="w-20 h-20 items-center justify-center rounded-full bg-surface dark:bg-dark-surface border border-borderSoft dark:border-dark-borderSoft m-3"
            android_ripple={{ color: STATE_LAYER_COLOR, borderless: true }}
            accessibilityRole="button"
            accessibilityLabel={value}
        >
            {({ pressed }: { pressed: boolean }) => (
                <>
                    {/* M3 pressed State Layer — primary at 12%, clips to circle */}
                    {pressed && (
                        <View
                            style={[StyleSheet.absoluteFillObject, { backgroundColor: STATE_LAYER_COLOR, borderRadius: 40 }]}
                            pointerEvents="none"
                        />
                    )}
                    {/* was raw Text — no dark mode. ThemedText uses textPrimary token */}
                    <ThemedText className="text-3xl font-medium text-textPrimary dark:text-dark-textPrimary">
                        {value}
                    </ThemedText>
                </>
            )}
        </Pressable>
    </Animated.View>
));
NumberButton.displayName = 'NumberButton';

// ─── PinDot ───────────────────────────────────────────────────────────────────

const PinDot = memo(({
    active,
    error,
    shakeStyle,
    themeColors,
}: {
    active: boolean;
    error: boolean;
    shakeStyle: any;
    themeColors: { error: string; primary: string; borderSoft: string };
}) => {
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withTiming(active ? 1.15 : 1, { duration: 200 });
    }, [active]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        backgroundColor: error
            ? themeColors.error
            : active
                ? themeColors.primary
                : 'transparent',
        borderColor: error
            ? themeColors.error
            : active
                ? themeColors.primary
                : themeColors.borderSoft,
    }));

    return (
        <Animated.View
            style={[shakeStyle, animatedStyle]}
            className="w-4 h-4 rounded-full mx-4 border-2"
        />
    );
});
PinDot.displayName = 'PinDot';

// ─── LockScreen ───────────────────────────────────────────────────────────────

export function LockScreen() {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasPinSet, setHasPinSet] = useState(true);
    const [bioPref, setBioPref] = useState(false);
    const { unlock } = useAuth();
    const { profile } = useUser();
    const factoryReset = useFactoryReset();
    const colors = useThemeColors();
    const shakeOffset = useSharedValue(0);

    // Determine which auth methods are configured, then auto-trigger bio if preferred
    useEffect(() => {
        let mounted = true;
        (async () => {
            const [pinSet, pref] = await Promise.all([
                SecurityService.hasPinConfigured(),
                SecurityService.getBiometricPreference(),
            ]);
            if (!mounted) return;
            setHasPinSet(pinSet);
            setBioPref(pref);
            if (pref) {
                // Auto-prompt biometric when the lock screen appears
                const success = await unlock();
                if (success && mounted) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
            }
        })();
        return () => { mounted = false; };
    }, []);

    const triggerShake = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        shakeOffset.value = withSequence(
            withTiming(-10, { duration: 50 }),
            withRepeat(withTiming(10, { duration: 50 }), 3, true),
            withTiming(0, { duration: 50 }),
        );
    };

    const handlePress = (num: string) => {
        if (isProcessing) return;
        setError(false);
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) {
                setIsProcessing(true);
                setTimeout(async () => {
                    await verify(newPin);
                    setIsProcessing(false);
                }, 150);
            }
        }
    };

    const handleBackspace = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setPin(pin.slice(0, -1));
    };

    const verify = async (input: string) => {
        const success = await unlock(input);
        if (success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            setError(true);
            triggerShake();
            setPin('');
        }
    };

    const handleBio = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const success = await unlock();
        if (success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (!hasPinSet) {
            // Biometric-only mode: show error since there's no PIN fallback
            setError(true);
            triggerShake();
        }
    };

    const handleForgotPin = () => {
        Alert.alert(
            'Forgot PIN?',
            'For your security, resetting your PIN will wipe all app data including transactions and categories. Do you want to proceed?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset App & Clear Data',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await factoryReset();
                            router.replace('/onboarding');
                        } catch (e) {
                            logger.error('Forgot-PIN reset failed', e);
                            Alert.alert('Reset failed', 'Something went wrong while resetting. Please try again.');
                        }
                    },
                },
            ],
        );
    };

    const shakeStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shakeOffset.value }],
    }));

    const firstName = profile?.name ? profile.name.trim().split(/\s+/)[0] : '';

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
            <View className="flex-1 items-center justify-center px-10">

                {/*
                  Logo badge
                  was: rounded-xl magic px + shadow-sm shadow-brand-primary/20 (mixed)
                  now: rounded-xl (24dp token) + shadows.sm style prop (theme/shadows.ts)
                */}
                <Animated.View
                    entering={FadeInUp.duration(800).springify().damping(15)}
                    className="items-center justify-center mb-6"
                >
                    <IconSymbol name="lock.fill" color={colors.primary} size={48} />
                </Animated.View>

                <Animated.View entering={FadeIn.delay(200).duration(800)} style={{ alignItems: 'center' }}>
                    <ThemedText
                        type="title"
                        className="mb-2 text-3xl text-textPrimary dark:text-dark-textPrimary"
                    >
                        Welcome back{firstName ? `, ${firstName}` : ''}
                    </ThemedText>
                    <ThemedText className="mb-12 text-base text-textMuted dark:text-dark-textMuted">
                        {hasPinSet ? 'Enter your PIN to continue' : 'Use biometrics to continue'}
                    </ThemedText>
                </Animated.View>

                {/* ── Biometric-only mode ────────────────────────────────── */}
                {!hasPinSet ? (
                    <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ alignItems: 'center', marginBottom: 40 }}>
                        <Pressable
                            onPress={handleBio}
                            className="w-28 h-28 items-center justify-center rounded-full bg-brand-primary/10"
                            style={shadows.sm}
                            android_ripple={{ color: STATE_LAYER_COLOR, borderless: true }}
                            accessibilityRole="button"
                            accessibilityLabel="Use biometric authentication"
                        >
                            {({ pressed }: { pressed: boolean }) => (
                                <>
                                    {pressed && (
                                        <View
                                            style={[StyleSheet.absoluteFillObject, { backgroundColor: STATE_LAYER_COLOR, borderRadius: 56 }]}
                                            pointerEvents="none"
                                        />
                                    )}
                                    <IconSymbol name="faceid" color={colors.primary} size={48} />
                                </>
                            )}
                        </Pressable>
                        {error && (
                            <ThemedText className="mt-4 text-sm text-expense dark:text-dark-expense text-center">
                                Biometric failed. Tap to try again.
                            </ThemedText>
                        )}
                    </Animated.View>
                ) : (
                    /* ── PIN pad mode ─────────────────────────────────────── */
                    <>
                        {/* PIN dots */}
                        <View style={{ flexDirection: 'row', marginBottom: 40 }}>
                            {[1, 2, 3, 4].map((i) => (
                                <PinDot
                                    key={i}
                                    active={pin.length >= i}
                                    error={error}
                                    shakeStyle={shakeStyle}
                                    themeColors={colors}
                                />
                            ))}
                        </View>

                        {/* Number pad */}
                        <View className="flex-row flex-wrap justify-center max-w-[320px] mb-8">
                            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num, i) => (
                                <NumberButton key={num} value={num} index={i} onPress={handlePress} />
                            ))}

                            {/* Biometric button — only shown when biometric is also preferred */}
                            {bioPref ? (
                                <Animated.View entering={FadeInDown.delay(600).duration(500)}>
                                    <Pressable
                                        onPress={handleBio}
                                        className="w-20 h-20 items-center justify-center m-3 bg-brand-primary/5 rounded-full"
                                        android_ripple={{ color: STATE_LAYER_COLOR, borderless: true }}
                                        accessibilityRole="button"
                                        accessibilityLabel="Use biometric authentication"
                                    >
                                        {({ pressed }: { pressed: boolean }) => (
                                            <>
                                                {pressed && (
                                                    <View
                                                        style={[StyleSheet.absoluteFillObject, { backgroundColor: STATE_LAYER_COLOR, borderRadius: 40 }]}
                                                        pointerEvents="none"
                                                    />
                                                )}
                                                <IconSymbol name="faceid" color={colors.primary} size={32} />
                                            </>
                                        )}
                                    </Pressable>
                                </Animated.View>
                            ) : (
                                <View className="w-20 h-20 m-3" />
                            )}

                            <NumberButton value="0" index={9} onPress={handlePress} />

                            {/* Backspace button */}
                            <Animated.View entering={FadeInDown.delay(600).duration(500)}>
                                <Pressable
                                    onPress={handleBackspace}
                                    className="w-20 h-20 items-center justify-center m-3 bg-surface dark:bg-dark-surface rounded-full border border-borderSoft dark:border-dark-borderSoft"
                                    style={shadows.sm}
                                    android_ripple={{ color: STATE_LAYER_COLOR, borderless: true }}
                                    accessibilityRole="button"
                                    accessibilityLabel="Delete last digit"
                                >
                                    {({ pressed }: { pressed: boolean }) => (
                                        <>
                                            {pressed && (
                                                <View
                                                    style={[StyleSheet.absoluteFillObject, { backgroundColor: STATE_LAYER_COLOR, borderRadius: 40 }]}
                                                    pointerEvents="none"
                                                />
                                            )}
                                            <IconSymbol name="delete.left.fill" color={colors.expense} size={28} />
                                        </>
                                    )}
                                </Pressable>
                            </Animated.View>
                        </View>
                    </>
                )}

                <Pressable onPress={handleForgotPin} accessibilityRole="button">
                    <ThemedText type="link" className="font-semibold">
                        {hasPinSet ? 'Forgot PIN?' : 'Reset App'}
                    </ThemedText>
                </Pressable>

            </View>
        </SafeAreaView>
    );
}
