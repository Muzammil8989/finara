import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { Pressable } from './pressable';
import { ThemedText } from './themed-text';

interface SheetHeaderProps {
    title: string;
    onClose: () => void;
    /** Small uppercase line above the title, e.g. "NEW TRANSACTION". */
    kicker?: string;
}

export function SheetHeader({ title, onClose, kicker }: SheetHeaderProps) {
    const colors = useThemeColors();
    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
                {!!kicker && <ThemedText type="kicker" className="mb-1">{kicker}</ThemedText>}
                <ThemedText type="headline" accessibilityRole="header">{title}</ThemedText>
            </View>
            <Pressable
                onPress={onClose}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={({ pressed }) => ({
                    width: 40, height: 40, borderRadius: 20, marginRight: -8,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: pressed ? colors.backgroundAlt : 'transparent',
                })}
            >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
        </View>
    );
}
