import { ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { View } from 'react-native';
import { Pressable } from '@/components/common/pressable';

interface ProfileCardProps {
    name: string;
    avatar: string | null;
    onPress: () => void;
}

export function ProfileCard({ name, avatar, onPress }: ProfileCardProps) {
    const colors = useThemeColors();

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${name || 'Your profile'}. Edit profile`}
            className="flex-row items-center p-4 mb-7 rounded-xl border border-divider dark:border-dark-divider"
            style={({ pressed }) => ({ backgroundColor: pressed ? colors.backgroundAlt : colors.surface })}
        >
            <View
                className="w-16 h-16 rounded-full items-center justify-center overflow-hidden border border-divider dark:border-dark-divider"
                style={{ backgroundColor: colors.surface }}
            >
                {avatar ? (
                    <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                    <Ionicons name="person" size={28} color={colors.textSecondary} />
                )}
            </View>

            <View className="ml-4 flex-1">
                <ThemedText type="headline" className="text-[22px] leading-7" numberOfLines={1}>
                    {name || 'Your name'}
                </ThemedText>
                <ThemedText type="caption" className="mt-0.5">Edit name, photo and currency</ThemedText>
            </View>

            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
    );
}
