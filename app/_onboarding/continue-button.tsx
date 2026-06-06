import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface ContinueButtonProps {
    onPress: () => void;
    isLoading: boolean;
}

const PRESSED_SCALE = 0.97;

export function ContinueButton({ onPress, isLoading }: ContinueButtonProps) {
    const colors = useThemeColors();

    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <Animated.View entering={FadeInDown.delay(440).duration(600)}>
            {/* Primary CTA */}
            <Animated.View
                style={[
                    animatedStyle,
                    {
                        borderRadius: 16,
                        overflow: 'hidden',
                        shadowColor: colors.primary,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.38,
                        shadowRadius: 14,
                        elevation: 8,
                    },
                    isLoading && { opacity: 0.7 },
                ]}
            >
                <Pressable
                    onPress={onPress}
                    disabled={isLoading}
                    onPressIn={() => { scale.value = withTiming(PRESSED_SCALE, { duration: 80 }); }}
                    onPressOut={() => { scale.value = withTiming(1, { duration: 160 }); }}
                    accessibilityRole="button"
                    accessibilityLabel="Continue"
                    accessibilityState={{ busy: isLoading, disabled: isLoading }}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.primaryLight]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                            paddingVertical: 14,
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            gap: 10,
                        }}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={colors.textOnPrimary} />
                        ) : (
                            <>
                                <Text allowFontScaling={false} style={{
                                    fontFamily: 'PlusJakartaSans_700Bold',
                                    fontSize: 17,
                                    color: colors.textOnPrimary,
                                    letterSpacing: 0.3,
                                }}>
                                    Get Started
                                </Text>
                                <Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />
                            </>
                        )}
                    </LinearGradient>
                </Pressable>
            </Animated.View>

            {/* Legal — both links tappable and consistently styled */}
            <View className="mt-3 px-6">
                <Text allowFontScaling={false} style={{
                    textAlign: 'center',
                    fontSize: 12,
                    color: colors.textMuted,
                    fontFamily: 'PlusJakartaSans_400Regular',
                    lineHeight: 20,
                }}>
                    {'By continuing, you agree to our '}
                    <Text
                        allowFontScaling={false}
                        style={{ color: colors.primary, fontFamily: 'PlusJakartaSans_600SemiBold' }}
                        accessibilityRole="link"
                        onPress={() => router.push('/terms')}
                    >
                        Terms of Use
                    </Text>
                    {' and '}
                    <Text
                        allowFontScaling={false}
                        style={{ color: colors.primary, fontFamily: 'PlusJakartaSans_600SemiBold' }}
                        accessibilityRole="link"
                        onPress={() => router.push('/privacy')}
                    >
                        Privacy Policy
                    </Text>
                    {'.'}
                </Text>
            </View>
        </Animated.View>
    );
}
