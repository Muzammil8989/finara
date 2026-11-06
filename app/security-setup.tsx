import { IconSymbol, ThemedText } from '@/components/common';
import type { IconSymbolName } from '@/components/common';
import { useAuth } from '@/features/auth/context/auth-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useFactoryReset } from '@/features/auth/hooks/use-factory-reset';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import { shadows } from '@/theme/shadows';
import { SecurityService } from '@/features/auth/services/security-service';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { memo, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

// Keypad geometry: 3 explicit rows so keys never wrap on narrow (<392dp) screens.
const KEY_MAX_SIZE = 80;
const KEY_GAP = 16;
const SCREEN_PADDING_X = 24; // px-6

const NumberButton = memo(({ value, index, size, onPress }: { value: string, index: number, size: number, onPress: (v: string) => void }) => (
    <Animated.View entering={FadeInDown.delay(100 + index * 10).duration(400)}>
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress(value);
            }}
            className="items-center justify-center rounded-full bg-surface dark:bg-dark-surface border border-borderSoft dark:border-dark-borderSoft active:opacity-60"
            style={[shadows.sm, { width: size, height: size, borderRadius: size / 2 }]}
            accessibilityRole="button"
            accessibilityLabel={value}
        >
            <Text maxFontSizeMultiplier={1.3} className="text-3xl font-medium text-textPrimary dark:text-dark-textPrimary">{value}</Text>
        </Pressable>
    </Animated.View>
));
NumberButton.displayName = 'NumberButton';

const PinDot = memo(({ active, error, shakeStyle, themeColors }: { active: boolean, error: boolean, shakeStyle: any, themeColors: { error: string, primary: string, borderSoft: string } }) => {
    const scale = useSharedValue(1);
    useEffect(() => {
        scale.value = withTiming(active ? 1.2 : 1, { duration: 200 });
    }, [active, scale]);

    const errorColor = themeColors.error;
    const primaryColor = themeColors.primary;
    const borderColor = themeColors.borderSoft;

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        backgroundColor: error ? errorColor : active ? primaryColor : 'transparent',
        borderColor: error ? errorColor : active ? primaryColor : borderColor,
    }));

    // Size/shape in style: NativeWind className isn't reliably applied to Reanimated views.
    return <Animated.View style={[{ width: 16, height: 16, borderRadius: 8, marginHorizontal: 16, borderWidth: 2 }, shakeStyle, animatedStyle]} />;
});
PinDot.displayName = 'PinDot';

export default function SecuritySetupScreen() {
    const { mode } = useLocalSearchParams<{ mode: 'set' | 'remove' | 'reset' }>();
    const { recheckSecurity } = useAuth();
    const factoryReset = useFactoryReset();
    const colors = useThemeColors();
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState<'enter' | 'confirm' | 'verify'>(mode === 'remove' || mode === 'reset' ? 'verify' : 'enter');
    const [error, setError] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const shakeOffset = useSharedValue(0);
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const keySize = Math.floor(Math.min(KEY_MAX_SIZE, (windowWidth - SCREEN_PADDING_X * 2 - KEY_GAP * 2) / 3));
    const isShortScreen = windowHeight < 700;

    const triggerShake = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        shakeOffset.value = withSequence(
            withTiming(-10, { duration: 50 }),
            withRepeat(withTiming(10, { duration: 50 }), 3, true),
            withTiming(0, { duration: 50 })
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
                // Mini delay for visual feedback of the last dot
                setTimeout(async () => {
                    try {
                        await processStep(newPin);
                    } catch (e) {
                        logger.error('Security setup step failed', e);
                        setPin('');
                        toast.error('Something went wrong', 'Please try again');
                    } finally {
                        setIsProcessing(false);
                    }
                }, 150);
            }
        }
    };

    const processStep = async (enteredPin: string) => {
        if (step === 'enter') {
            setConfirmPin(enteredPin);
            setPin('');
            setStep('confirm');
        } else if (step === 'confirm') {
            if (enteredPin === confirmPin) {
                await SecurityService.setPin(enteredPin);
                await recheckSecurity();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                toast.success('Security Enabled', 'Your account is now protected with a PIN');
                setTimeout(() => router.back(), 500);
            } else {
                setError(true);
                triggerShake();
                setPin('');
                toast.error('PIN Mismatch', 'The codes you entered don\'t match');
                setTimeout(() => setStep('enter'), 2000);
            }
        } else if (step === 'verify') {
            const lockout = await SecurityService.isLockedOut();
            if (lockout.locked) {
                setError(true);
                triggerShake();
                setPin('');
                const minutes = Math.ceil(lockout.remainingMs / 60000);
                toast.error('Too many attempts', `Try again in ${minutes} minute${minutes === 1 ? '' : 's'}`);
                return;
            }
            const isValid = await SecurityService.verifyPin(enteredPin);
            if (isValid) {
                if (mode === 'reset') {
                    // Start Factory Reset after verification
                    Alert.alert(
                        "Final Confirmation",
                        "This will wipe everything. All your data will be lost forever.",
                        [
                            { text: "Cancel", style: "cancel" },
                            {
                                text: "Wipe Everything",
                                style: "destructive",
                                onPress: async () => {
                                    try {
                                        await factoryReset();
                                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                        router.replace('/onboarding');
                                    } catch (e) {
                                        logger.error('Factory reset failed', e);
                                        Alert.alert('Reset failed', 'Something went wrong while resetting. Please try again.');
                                    }
                                }
                            }
                        ]
                    );
                } else {
                    await SecurityService.clearSecurity();
                    await recheckSecurity(); // Updates the UI instantly!
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    toast.success('Security Disabled', 'Your PIN has been removed');
                    setTimeout(() => router.back(), 500);
                }
            } else {
                setError(true);
                triggerShake();
                setPin('');
                toast.error('Incorrect PIN', 'Please try again');
            }
        }
    };

    const handleBackspace = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setPin(pin.slice(0, -1));
    };

    const shakeStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shakeOffset.value }]
    }));

    const title = step === 'enter' ? "Secure Your Account" : step === 'confirm' ? "Verify Security Code" : mode === 'reset' ? "Confirm Factory Reset" : "Remove Security";
    const subtitle = step === 'enter' ? "Create a 4-digit PIN to protect your financial data" : step === 'confirm' ? "Re-enter your PIN to confirm" : mode === 'reset' ? "Enter your PIN to authorize complete data removal" : "Enter your PIN to disable account protection";
    const iconName: IconSymbolName = mode === 'remove' || mode === 'reset' ? 'lock.open.fill' : 'lock.fill';

    return (
        <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background dark:bg-dark-background">
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <View className="flex-1 items-center justify-center px-6 py-6">
                    <Animated.View
                        entering={FadeInUp.duration(800).springify().damping(15)}
                        className="w-16 h-16 rounded-full items-center justify-center mb-6 border border-divider dark:border-dark-divider"
                    >
                        <IconSymbol name={iconName} color={colors.primary} size={28} />
                    </Animated.View>

                    <Animated.View entering={FadeIn.delay(200).duration(800)} style={{ alignItems: 'center', marginBottom: 40 }}>
                        <ThemedText type="headline" className="text-[26px] leading-8 mb-2 text-center" accessibilityRole="header">{title}</ThemedText>
                        <ThemedText className="text-center text-[15px] leading-6 text-textSecondary dark:text-dark-textSecondary">{subtitle}</ThemedText>
                    </Animated.View>

                    <View style={{ flexDirection: 'row', marginBottom: isShortScreen ? 32 : 60 }}>
                        {[1, 2, 3, 4].map((i) => (
                            <PinDot key={i} active={pin.length >= i} error={error} shakeStyle={shakeStyle} themeColors={colors} />
                        ))}
                    </View>

                    <View style={{ gap: KEY_GAP }}>
                        {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].map((row, r) => (
                            <View key={row[0]} style={{ flexDirection: 'row', gap: KEY_GAP }}>
                                {row.map((num, c) => (
                                    <NumberButton key={num} value={num} index={r * 3 + c} size={keySize} onPress={handlePress} />
                                ))}
                            </View>
                        ))}
                        <View style={{ flexDirection: 'row', gap: KEY_GAP }}>
                            <View style={{ width: keySize, height: keySize }} />
                            <NumberButton value="0" index={9} size={keySize} onPress={handlePress} />
                            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                                <Pressable
                                    onPress={handleBackspace}
                                    className="items-center justify-center active:opacity-60 bg-surface dark:bg-dark-surface rounded-full border border-borderSoft dark:border-dark-borderSoft"
                                    style={{ width: keySize, height: keySize, borderRadius: keySize / 2 }}
                                    accessibilityRole="button"
                                    accessibilityLabel="Delete last digit"
                                >
                                    <IconSymbol name="delete.left.fill" color={colors.textSecondary} size={26} />
                                </Pressable>
                            </Animated.View>
                        </View>
                    </View>

                    <Pressable onPress={() => router.back()} accessibilityRole="button" className={`${isShortScreen ? 'mt-8' : 'mt-12'} min-h-[44px] justify-center px-8 rounded-full border border-borderSoft dark:border-dark-borderSoft active:bg-surface dark:active:bg-dark-surface`}>
                        <ThemedText type="label" className="text-textSecondary dark:text-dark-textSecondary">Cancel</ThemedText>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
