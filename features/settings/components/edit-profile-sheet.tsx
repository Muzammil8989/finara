import { AppButton, BottomSheet, SheetHeader, ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { fonts } from '@/theme/typography';
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
            paddingHorizontal={24}
            paddingTop={16}
            paddingBottom={insets.bottom + 28}
            keyboardAvoiding
        >
            <SheetHeader kicker="Profile" title="Edit profile" onClose={onClose} />

            {/* Avatar */}
            <View className="items-center mb-7">
                <Pressable
                    onPress={onAvatarPress}
                    accessibilityRole="button"
                    accessibilityLabel={avatar ? 'Change photo' : 'Add photo'}
                    className="items-center"
                >
                    <View
                        className="w-24 h-24 rounded-full items-center justify-center overflow-hidden border border-divider dark:border-dark-divider"
                        style={{ backgroundColor: colors.backgroundAlt }}
                    >
                        {avatar ? (
                            <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        ) : (
                            <Ionicons name="person-outline" size={36} color={colors.textMuted} />
                        )}
                    </View>
                    <ThemedText type="label" className="mt-2" style={{ color: colors.primary }}>
                        {avatar ? 'Change photo' : 'Add photo'}
                    </ThemedText>
                </Pressable>
            </View>

            {/* Name */}
            <ThemedText type="kicker" className="mb-2">Your name</ThemedText>
            <TextInput
                value={name}
                onChangeText={onNameChange}
                placeholder="Enter your name"
                placeholderTextColor={colors.inputPlaceholder}
                accessibilityLabel="Your name"
                maxLength={50}
                returnKeyType="done"
                onSubmitEditing={onSave}
                className="mb-7"
                style={{
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                    borderColor: colors.borderStrong,
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    height: 52,
                    fontSize: 16,
                    fontFamily: fonts.sans,
                }}
            />

            <AppButton label="Save changes" onPress={onSave} />
        </BottomSheet>
    );
}
