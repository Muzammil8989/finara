import { ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Modal,
    Pressable,
    View,
} from 'react-native';

interface PlaceholderModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
}

export function PlaceholderModal({ visible, onClose, title }: PlaceholderModalProps) {
    const colors = useThemeColors();
    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View className="flex-1 justify-end bg-black/40">
                <View className="bg-surface dark:bg-dark-surface rounded-t-[40px] px-8 pt-10 pb-16 shadow-2xl items-center overflow-hidden">
                    <LinearGradient
                        colors={['rgba(36, 107, 253, 0.15)', 'transparent']}
                        className="absolute top-0 left-0 right-0 h-[40%]"
                    />
                    <View className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mb-8" />
                    <Ionicons name="construct-outline" size={64} color={colors.primary} className="mb-4" />
                    <ThemedText className="text-xl font-black mb-2">{title}</ThemedText>
                    <ThemedText className="text-sm text-gray-500 text-center mb-8">This feature is coming soon! Our team is working hard to bring you the best experience.</ThemedText>
                    <Pressable onPress={onClose} className="w-full py-4 rounded-2xl bg-primary items-center shadow-lg shadow-primary/30">
                        <ThemedText className="font-black text-white">Got it!</ThemedText>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}
