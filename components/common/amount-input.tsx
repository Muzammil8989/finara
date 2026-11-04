import { useThemeColors } from '@/hooks/use-theme-colors';
import { fonts } from '@/theme/typography';
import { numberToWords, parseAmount } from '@/lib/utils/currency';
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
        const accentColor = color ?? colors.textPrimary;
        const hasValue = !!value && !isNaN(parseAmount(value)) && parseAmount(value) > 0;

        return (
            <View style={{ paddingVertical: 20, marginBottom: 20, borderBottomWidth: 1, borderColor: colors.divider }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
                    <ThemedText
                        className="text-2xl"
                        style={{ color: colors.textMuted, fontFamily: fonts.figure }}
                    >
                        {currencySymbol}
                    </ThemedText>
                    <TextInput
                        ref={ref}
                        value={value}
                        onChangeText={onChange}
                        placeholder={placeholder}
                        placeholderTextColor={colors.borderStrong}
                        accessibilityLabel="Amount"
                        keyboardType="decimal-pad"
                        underlineColorAndroid="transparent"
                        style={{
                            fontSize,
                            color: accentColor,
                            fontFamily: fonts.figureSemiBold,
                            fontVariant: ['tabular-nums'],
                            textAlign: 'center',
                            flex: 1,
                            backgroundColor: 'transparent',
                        }}
                    />
                </View>
                {hasValue && (
                    <View style={{ alignItems: 'center', marginTop: 8 }}>
                        <ThemedText type="caption" className="text-center">
                            {numberToWords(parseAmount(value))}
                        </ThemedText>
                    </View>
                )}
            </View>
        );
    }
);
