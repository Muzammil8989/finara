import { AppButton, ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, FadeInUp, FadeOutDown } from 'react-native-reanimated';

interface DeleteSheetProps {
    name: string;
    onCancel: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
}

export function DeleteSheet({ name, onCancel, onConfirm, isDeleting }: DeleteSheetProps) {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();

    return (
        <Modal visible animationType="fade" transparent onRequestClose={onCancel}>
            <View className="flex-1 justify-end bg-black/50">
                <Animated.View
                    entering={FadeInUp.duration(300).easing(Easing.out(Easing.cubic))}
                    style={{
                        backgroundColor: colors.surface,
                        borderTopLeftRadius: 40,
                        borderTopRightRadius: 40,
                        paddingHorizontal: 28,
                        paddingTop: 36,
                        paddingBottom: insets.bottom + 32,
                        overflow: 'hidden',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: 0.12,
                        shadowRadius: 20,
                        elevation: 24,
                    }}
                >
                    <LinearGradient
                        colors={[`${colors.error}18`, `${colors.error}06`, 'transparent']}
                        className="absolute top-0 left-0 right-0 h-40"
                    />

                    <View className="w-12 h-1.5 bg-borderStrong dark:bg-dark-borderStrong rounded-full mx-auto mb-8" />

                    <View
                        className="w-16 h-16 rounded-3xl items-center justify-center mx-auto mb-5"
                        style={{ backgroundColor: `${colors.error}18` }}
                    >
                        <Ionicons name="trash-outline" size={30} color={colors.error} />
                    </View>

                    <ThemedText className="text-xl font-bold text-center text-textPrimary dark:text-dark-textPrimary mb-2">
                        Delete Goal
                    </ThemedText>
                    <ThemedText className="text-sm text-center text-textMuted dark:text-dark-textMuted leading-6 mb-8 px-4">
                        Delete{' '}
                        <ThemedText className="font-bold text-textPrimary dark:text-dark-textPrimary">{name}</ThemedText>
                        {'? '}This cannot be undone.
                    </ThemedText>

                    <View className="flex-row gap-3">
                        <AppButton label="Cancel" onPress={onCancel} variant="secondary" flex />
                        <AppButton label="Delete" onPress={onConfirm} variant="destructive" loading={isDeleting} disabled={isDeleting} flex />
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}
