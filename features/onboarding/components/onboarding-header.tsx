import { ThemedText } from '@/components/common';
import { Image } from 'expo-image';
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

interface OnboardingHeaderProps {
    safeAreaTop: number;
}

export function OnboardingHeader({ safeAreaTop }: OnboardingHeaderProps) {
    return (
        <View
            className="items-center px-7 pb-8"
            style={{ paddingTop: safeAreaTop + 16 }}
        >
            {/* App icon */}
            <Animated.View entering={FadeIn.delay(60).duration(700)} style={{ marginBottom: 12 }}>
                {/* Paper-tile variant of the mark so it stands out on the teal masthead */}
                <Image
                    source={require('@/assets/images/brand-mark-light.png')}
                    style={{ width: 72, height: 72 }}
                    contentFit="contain"
                    accessibilityLabel="Folio logo"
                />
            </Animated.View>

            {/* Brand name */}
            <Animated.View entering={FadeInDown.delay(160).duration(600)} style={{ alignItems: 'center', marginBottom: 4 }}>
                <ThemedText
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={{
                        fontFamily: 'PlayfairDisplay_700Bold_Italic',
                        fontSize: 44,
                        color: '#FFFFFF',
                        letterSpacing: 0.5,
                        lineHeight: 52,
                    }}
                >
                    Folio
                </ThemedText>
            </Animated.View>

            {/* Tagline */}
            <Animated.View entering={FadeInDown.delay(240).duration(500)}>
                <ThemedText
                    style={{
                        fontFamily: 'PlusJakartaSans_400Regular',
                        fontSize: 15,
                        color: 'rgba(255,255,255,0.82)',
                        textAlign: 'center',
                        lineHeight: 20,
                        letterSpacing: 0.3,
                    }}
                >
                    Your money, clearly kept.
                </ThemedText>
            </Animated.View>
        </View>
    );
}
