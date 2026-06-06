import { ThemedText } from '@/components/common';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface ProfileCardProps {
    name: string;
    avatar: string | null;
    onPress: () => void;
}

export function ProfileCard({ name, avatar, onPress }: ProfileCardProps) {
    const colors = useThemeColors();
    const colorScheme = useColorScheme();

    const gradient = colorScheme === 'dark'
        ? [`${colors.primary}3A`, `${colors.primary}20`, `${colors.primary}08`] as const
        : [`${colors.primary}22`, `${colors.primary}10`, `${colors.primary}04`] as const;

    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center p-6 rounded-[32px] mb-8 overflow-hidden"
            style={({ pressed }) => [
                styles.card,
                { borderColor: `${colors.primary}30` },
                pressed && { opacity: 0.85 },
            ]}
        >
            {/* Gradient background */}
            <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Decorative circle — top-right */}
            <View
                pointerEvents="none"
                style={[
                    styles.circleTopRight,
                    { backgroundColor: colorScheme === 'dark' ? `${colors.primary}22` : `${colors.primary}14` },
                ]}
            />

            {/* Decorative circle — bottom-left */}
            <View
                pointerEvents="none"
                style={[
                    styles.circleBottomLeft,
                    { backgroundColor: colorScheme === 'dark' ? `${colors.primary}16` : `${colors.primary}0C` },
                ]}
            />

            {/* Avatar */}
            <View
                className="w-20 h-20 rounded-full items-center justify-center overflow-hidden"
                style={{
                    borderWidth: 2,
                    borderColor: `${colors.primary}40`,
                    backgroundColor: colorScheme === 'dark' ? `${colors.primary}18` : `${colors.primary}0F`,
                }}
            >
                {avatar ? (
                    <Image
                        source={{ uri: avatar }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                    />
                ) : (
                    <Ionicons name="person" size={32} color={colors.primary} />
                )}
            </View>

            <View className="ml-5 flex-1">
                <ThemedText className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary">
                    {name || 'Your Name'}
                </ThemedText>
                <ThemedText className="text-sm mt-0.5" style={{ color: colors.textMuted }}>
                    Tap to edit profile
                </ThemedText>
            </View>

            <View
                className="w-9 h-9 rounded-2xl items-center justify-center ml-4 self-center"
                style={{ backgroundColor: `${colors.primary}20` }}
            >
                <Ionicons name="pencil" size={16} color={colors.primary} />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
    },
    circleTopRight: {
        position: 'absolute',
        top: -35,
        right: -35,
        width: 130,
        height: 130,
        borderRadius: 65,
    },
    circleBottomLeft: {
        position: 'absolute',
        bottom: -25,
        left: 60,
        width: 90,
        height: 90,
        borderRadius: 45,
    },
});
