import { AppButton, ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface ContinueButtonProps {
    onPress: () => void;
    isLoading: boolean;
}

export function ContinueButton({ onPress, isLoading }: ContinueButtonProps) {
    const colors = useThemeColors();

    return (
        <Animated.View entering={FadeInDown.delay(440).duration(600)}>
            <AppButton label="Get started" icon="arrow-forward" onPress={onPress} loading={isLoading} disabled={isLoading} />

            <View className="mt-4 px-4">
                <ThemedText type="caption" className="text-center leading-5">
                    {'By continuing, you agree to our '}
                    <ThemedText
                        type="caption"
                        className="font-semibold"
                        style={{ color: colors.primary }}
                        accessibilityRole="link"
                        onPress={() => router.push('/terms')}
                    >
                        Terms of Use
                    </ThemedText>
                    {' and '}
                    <ThemedText
                        type="caption"
                        className="font-semibold"
                        style={{ color: colors.primary }}
                        accessibilityRole="link"
                        onPress={() => router.push('/privacy')}
                    >
                        Privacy Policy
                    </ThemedText>
                    .
                </ThemedText>
            </View>
        </Animated.View>
    );
}
