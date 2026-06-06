import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';
import { ThemedText } from './themed-text';

interface SheetHeaderProps {
    title: string;
    onClose: () => void;
}

export function SheetHeader({ title, onClose }: SheetHeaderProps) {
    const colors = useThemeColors();
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <ThemedText className="text-xl font-bold text-textPrimary dark:text-dark-textPrimary">{title}</ThemedText>
            <Pressable onPress={onClose} style={{ padding: 8 }}>
                <Ionicons name="close" size={24} color={colors.error} />
            </Pressable>
        </View>
    );
}
