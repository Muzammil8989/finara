import { BottomSheet, SheetHeader, ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface EditProfileSheetProps {
    visible: boolean;
    name: string;
    avatar: string | null;
    onNameChange: (value: string) => void;
    onAvatarPress: () => void;
    onSave: () => void;
    onClose: () => void;
}

export function EditProfileSheet({
    visible,
    name,
    avatar,
    onNameChange,
    onAvatarPress,
    onSave,
    onClose,
}: EditProfileSheetProps) {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();

    return (
        <BottomSheet
            visible={visible}
            onClose={onClose}
            paddingHorizontal={32}
            paddingTop={40}
            paddingBottom={insets.bottom + 40}
            borderTopRadius={40}
            gradientColors={[`${colors.primary}1A`, `${colors.primary}0D`, 'transparent']}
        >
            <SheetHeader title="Edit Profile" onClose={onClose} />

            {/* Avatar picker */}
            <View className="items-center mb-10">
                <Pressable onPress={onAvatarPress} className="relative">
                    <View
                        className="w-32 h-32 rounded-full items-center justify-center overflow-hidden bg-backgroundAlt dark:bg-dark-backgroundAlt"
                        style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: `${colors.primary}40` }}
                    >
                        {avatar ? (
                            <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        ) : (
                            <Ionicons name="person-outline" size={48} color={colors.textMuted} style={{ opacity: 0.4 }} />
                        )}
                    </View>
                    <View
                        className="absolute bottom-0 right-0 rounded-full p-2.5 bg-primary"
                        style={{
                            borderWidth: 3,
                            borderColor: colors.surface,
                            shadowColor: colors.primary,
                            shadowOffset: { width: 0, height: 3 },
                            shadowOpacity: 0.35,
                            shadowRadius: 6,
                            elevation: 6,
                        }}
                    >
                        <Ionicons name="camera-outline" size={18} color={colors.white} />
                    </View>
                </Pressable>
            </View>

            {/* Name input */}
            <View className="mb-8">
                <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted ml-1 mb-3">
                    Your Name
                </ThemedText>
                <TextInput
                    value={name}
                    onChangeText={onNameChange}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.textMuted}
                    style={{
                        backgroundColor: colors.backgroundAlt,
                        color: colors.textPrimary,
                        borderColor: colors.borderSoft,
                        borderWidth: 1,
                        borderRadius: 16,
                        paddingHorizontal: 20,
                        paddingVertical: 18,
                        fontSize: 17,
                        fontFamily: 'PlusJakartaSans_600SemiBold',
                    }}
                />
            </View>

            {/* Save button */}
            <Pressable
                onPress={onSave}
                className="w-full py-5 rounded-2xl items-center bg-primary"
                style={{
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    elevation: 8,
                }}
            >
                <ThemedText className="font-bold text-lg text-white">
                    Save Changes
                </ThemedText>
            </Pressable>
        </BottomSheet>
    );
}
