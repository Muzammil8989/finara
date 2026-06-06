import { useThemeColors } from '@/hooks/use-theme-colors';
import { formatWithCommas, numberToWords } from '@/lib/utils/currency';
import React, { forwardRef } from 'react';
import { TextInput, View } from 'react-native';
import { ThemedText } from './themed-text';

export interface AmountInputProps {
    value: string;
    onChange: (v: string) => void;
    currencySymbol?: string;
    color?: string;
    placeholder?: string;
    fontSize?: number;
}

export const AmountInput = forwardRef<TextInput, AmountInputProps>(
    function AmountInput({ value, onChange, currencySymbol = '$', color, placeholder = '0.00', fontSize = 48 }, ref) {
        const colors = useThemeColors();
        const accentColor = color ?? colors.primary;
        const hasValue = !!value && !isNaN(parseFloat(value)) && parseFloat(value) > 0;

        return (
            <View style={{ paddingVertical: 24, marginBottom: 32 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
                    <ThemedText
                        className="text-2xl font-bold"
                        style={{ color: `${accentColor}99` }}
                    >
                        {currencySymbol}
                    </ThemedText>
                    <TextInput
                        ref={ref}
                        value={value}
                        onChangeText={onChange}
                        placeholder={placeholder}
                        placeholderTextColor={`${accentColor}33`}
                        keyboardType="decimal-pad"
                        underlineColorAndroid="transparent"
                        style={{
                            fontSize,
                            color: accentColor,
                            fontFamily: 'SpaceGrotesk_700Bold',
                            textAlign: 'center',
                            flex: 1,
                            backgroundColor: 'transparent',
                        }}
                    />
                </View>
                {hasValue && (
                    <View style={{ alignItems: 'center', marginTop: 12, gap: 4 }}>
                        <ThemedText className="text-base font-bold" style={{ color: accentColor }}>
                            {formatWithCommas(value)}
                        </ThemedText>
                        <ThemedText className="text-xs font-medium text-textMuted dark:text-dark-textMuted">
                            {numberToWords(parseFloat(value))}
                        </ThemedText>
                    </View>
                )}
            </View>
        );
    }
);
