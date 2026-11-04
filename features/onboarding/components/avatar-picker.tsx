import { ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface AvatarPickerProps {
    avatar: string | null;
    name: string;
    onPress: () => void;
}

const PRESSED_SCALE = 0.94;

export function AvatarPicker({ avatar, name, onPress }: AvatarPickerProps) {
    const colors = useThemeColors();
    const initial = name.trim().charAt(0).toUpperCase();
    const hasInitial = !avatar && name.trim().length > 0;

    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            className="items-center mb-4"
        >
            <Pressable
                onPress={onPress}
                onPressIn={() => { scale.value = withTiming(PRESSED_SCALE, { duration: 80 }); }}
                onPressOut={() => { scale.value = withTiming(1, { duration: 160 }); }}
                accessibilityRole="button"
                accessibilityLabel="Change profile picture"
            >
                <Animated.View style={[{ alignItems: 'center' }, animatedStyle]}>
                    {/* Avatar circle */}
                    <View style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: colors.surfaceAlt,
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        borderWidth: avatar ? 3 : 1.5,
                        borderColor: avatar
                            ? colors.primary
                            : hasInitial
                                ? colors.primary + '80'
                                : colors.borderStrong,
                    }}>
                        {avatar ? (
                            <Image
                                source={{ uri: avatar }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                            />
                        ) : hasInitial ? (
                            <ThemedText style={{
                                fontSize: 36,
                                fontFamily: 'PlayfairDisplay_600SemiBold',
                                color: colors.primary,
                            }}>
                                {initial}
                            </ThemedText>
                        ) : (
                            <Ionicons name="person-outline" size={38} color={colors.textMuted} />
                        )}
                    </View>

                    {/* Camera badge */}
                    <View style={{
                        position: 'absolute',
                        bottom: 2,
                        right: 2,
                        backgroundColor: colors.primary,
                        borderRadius: 14,
                        width: 28,
                        height: 28,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: colors.surface,
                    }}>
                        <Ionicons name="camera" size={12} color={colors.textOnPrimary} />
                    </View>
                </Animated.View>
            </Pressable>

            <View className="items-center mt-2">
                <ThemedText style={{
                    fontFamily: 'PlusJakartaSans_600SemiBold',
                    fontSize: 14,
                    color: colors.textPrimary,
                    marginBottom: 2,
                }}>
                    {avatar ? 'Profile photo set' : 'Add profile photo'}
                </ThemedText>
                <ThemedText style={{
                    fontFamily: 'PlusJakartaSans_400Regular',
                    fontSize: 12,
                    color: colors.textMuted,
                }}>
                    {avatar ? 'Tap to change' : 'Optional · tap to choose'}
                </ThemedText>
            </View>
        </Animated.View>
    );
}
