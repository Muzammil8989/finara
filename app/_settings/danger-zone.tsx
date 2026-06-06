import { ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

interface DangerZoneProps {
    onFactoryReset: () => void;
}

export function DangerZone({ onFactoryReset }: DangerZoneProps) {
    const colors = useThemeColors();

    return (
        <View className="mb-12">
            <ThemedText
                className="mb-4 text-[10px] font-bold uppercase"
                style={{ color: colors.error }}
            >
                Danger Zone
            </ThemedText>
            <View
                className="rounded-3xl overflow-hidden"
                style={{
                    backgroundColor: `${colors.error}08`,
                    borderWidth: 1,
                    borderColor: `${colors.error}25`,
                }}
            >
                <Pressable
                    onPress={onFactoryReset}
                    className="flex-row items-center p-5"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                    <View className="w-10 h-10 items-center justify-center mr-4">
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </View>
                    <View className="flex-1">
                        <ThemedText
                            className="text-base font-bold"
                            style={{ color: colors.error }}
                        >
                            Factory Reset
                        </ThemedText>
                        <ThemedText
                            className="text-sm mt-0.5"
                            style={{ color: `${colors.error}80` }}
                        >
                            Wipe all data and security settings
                        </ThemedText>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.error} />
                </Pressable>
            </View>
        </View>
    );
}
