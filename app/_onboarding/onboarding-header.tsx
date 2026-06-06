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
            {/* Subtle depth circles */}
            <View className="absolute w-64 h-64 rounded-full bg-white/[0.05]" style={{ top: -70, right: -70 }} />
            <View className="absolute w-36 h-36 rounded-full bg-white/[0.08]" style={{ top: 10, left: -40 }} />

            {/* App icon */}
            <Animated.View entering={FadeIn.delay(60).duration(700)} style={{ marginBottom: 12 }}>
                <View style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    borderWidth: 1.5,
                    borderColor: 'rgba(255,255,255,0.36)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.16,
                    shadowRadius: 14,
                    elevation: 6,
                }}>
                    <Image
                        source={require('@/assets/images/android-icon-foreground.png')}
                        style={{ width: 52, height: 52 }}
                        contentFit="contain"
                        tintColor="#FFFFFF"
                    />
                </View>
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
                    Finara
                </ThemedText>
            </Animated.View>

            {/* Tagline */}
            <Animated.View entering={FadeInDown.delay(240).duration(500)}>
                <ThemedText
                    style={{
                        fontFamily: 'PlusJakartaSans_400Regular',
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.70)',
                        textAlign: 'center',
                        lineHeight: 20,
                        letterSpacing: 0.3,
                    }}
                >
                    Your money, your way.
                </ThemedText>
            </Animated.View>
        </View>
    );
}
