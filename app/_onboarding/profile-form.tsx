import { CurrencyPicker, ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface ProfileFormProps {
    name: string;
    onNameChange: (value: string) => void;
    currency: string;
    onCurrencyChange: (value: string) => void;
}

export function ProfileForm({ name, onNameChange, currency, onCurrencyChange }: ProfileFormProps) {
    const colors = useThemeColors();
    const [nameFocused, setNameFocused] = useState(false);

    return (
        <Animated.View entering={FadeInDown.delay(320).duration(600)}>
            {/* Full Name */}
            <View className="mb-4">
                <ThemedText
                    className="text-xs tracking-widest uppercase mb-2 ml-1"
                    style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.textMuted }}
                >
                    Full Name
                </ThemedText>
                <View>
                    <View className="absolute left-[18px] z-10" style={{ top: 17 }}>
                        <Ionicons
                            name="person-outline"
                            size={20}
                            color={nameFocused ? colors.inputBorderFocused : colors.textMuted}
                        />
                    </View>
                    <TextInput
                        value={name}
                        onChangeText={onNameChange}
                        onFocus={() => setNameFocused(true)}
                        onBlur={() => setNameFocused(false)}
                        placeholder="Enter your full name"
                        placeholderTextColor={colors.inputPlaceholder}
                        accessibilityLabel="Full name"
                        maxLength={50}
                        autoCapitalize="words"
                        autoCorrect={false}
                        returnKeyType="done"
                        textContentType="name"
                        underlineColorAndroid="transparent"
                        selectionColor={colors.inputBorderFocused}
                        style={{
                            backgroundColor: colors.inputBg,
                            color: colors.inputText,
                            borderColor: nameFocused ? colors.inputBorderFocused : colors.inputBorder,
                            borderWidth: nameFocused ? 1.5 : 1,
                            borderRadius: 14,
                            paddingHorizontal: 20,
                            paddingVertical: 13,
                            paddingLeft: 52,
                            fontSize: 16,
                            fontFamily: 'PlusJakartaSans_500Medium',
                        }}
                    />
                </View>
            </View>

            {/* Account Currency */}
            <View className="mb-5">
                <ThemedText
                    className="text-xs tracking-widest uppercase mb-2 ml-1"
                    style={{ fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.textMuted }}
                >
                    Account Currency
                </ThemedText>
                <CurrencyPicker value={currency} onSelect={onCurrencyChange} />
            </View>
        </Animated.View>
    );
}
