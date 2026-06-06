import { IconSymbol, ThemedText } from '@/components/common';
import type { IconSymbolName } from '@/components/common';
import { useAuth } from '@/features/auth/context/auth-context';
import { useUser } from '@/features/user/context/user-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { clearDatabase } from '@/lib/db/migrations';
import { toast } from '@/lib/toast';
import { SecurityService } from '@/features/auth/services/security-service';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { memo, useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, Text, View } from 'react-native';
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

const NumberButton = memo(({ value, index, onPress }: { value: string, index: number, onPress: (v: string) => void }) => (
    <Animated.View entering={FadeInDown.delay(100 + index * 10).duration(400)}>
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress(value);
            }}
            className="w-20 h-20 items-center justify-center rounded-full bg-surface dark:bg-dark-surface border border-borderSoft dark:border-dark-borderSoft active:opacity-60 m-2 shadow-sm"
        >
            <Text className="text-3xl font-medium text-textPrimary dark:text-dark-textPrimary">{value}</Text>
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

    return <Animated.View style={[shakeStyle, animatedStyle]} className="w-4 h-4 rounded-full mx-4 border-2" />;
});
PinDot.displayName = 'PinDot';

export default function SecuritySetupScreen() {
    const { mode } = useLocalSearchParams<{ mode: 'set' | 'remove' | 'reset' }>();
    const { recheckSecurity } = useAuth();
    const { updateProfile } = useUser();
    const colors = useThemeColors();
    const db = useSQLiteContext();
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState<'enter' | 'confirm' | 'verify'>(mode === 'remove' || mode === 'reset' ? 'verify' : 'enter');
    const [error, setError] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const shakeOffset = useSharedValue(0);

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
                setTimeout(() => {
                    processStep(newPin);
                    setIsProcessing(false);
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
                                    await clearDatabase(db);
                                    await SecurityService.clearSecurity();
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                    await updateProfile({ name: '', avatar: null, currency: 'USD', isOnboarded: false });
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
        <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
            <View className="flex-1 items-center justify-center px-10">
                <Animated.View
                    entering={FadeInUp.duration(800).springify().damping(15)}
                    className="w-16 h-16 bg-brand-primary/10 rounded-2xl items-center justify-center mb-6"
                >
                    <IconSymbol name={iconName} color={colors.primary} size={28} />
                </Animated.View>

                <Animated.View entering={FadeIn.delay(200).duration(800)} className="items-center mb-10">
                    <ThemedText type="title" className="text-2xl mb-2 text-textPrimary dark:text-dark-textPrimary">{title}</ThemedText>
                    <ThemedText className="opacity-40 text-center text-textSecondary dark:text-dark-textSecondary">{subtitle}</ThemedText>
                </Animated.View>

                <View style={{ flexDirection: 'row', marginBottom: 60 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <PinDot key={i} active={pin.length >= i} error={error} shakeStyle={shakeStyle} themeColors={colors} />
                    ))}
                </View>

                <View className="flex-row flex-wrap justify-center max-w-[320px]">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num, i) => (
                        <NumberButton key={num} value={num} index={i} onPress={handlePress} />
                    ))}
                    <View className="w-20 h-20 m-2" />
                    <NumberButton value="0" index={9} onPress={handlePress} />
                    <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                        <Pressable
                            onPress={handleBackspace}
                            className="w-20 h-20 items-center justify-center m-2 active:opacity-60 bg-surface dark:bg-dark-surface rounded-full border border-borderSoft dark:border-dark-borderSoft shadow-sm"
                        >
                            <IconSymbol name="delete.left.fill" color={colors.error} size={28} />
                        </Pressable>
                    </Animated.View>
                </View>

                <Pressable onPress={() => router.back()} className="mt-12 py-3 px-8 rounded-full border border-borderSoft dark:border-dark-borderSoft active:bg-surface dark:active:bg-dark-surface">
                    <ThemedText className="text-textSecondary dark:text-dark-textSecondary font-medium">Cancel Setup</ThemedText>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
