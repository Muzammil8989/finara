import { ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { Pressable } from '@/components/common/pressable';

interface Category {
    id: number;
    name: string;
    type: string;
    icon?: string | null;
    color?: string | null;
}

interface CategoryChipsProps {
    categories: Category[];
    selectedCategoryId: number | null;
    onSelect: (id: number) => void;
}

const COLUMNS = 3;

export function CategoryChips({ categories, selectedCategoryId, onSelect }: CategoryChipsProps) {
    const colors = useThemeColors();

    if (categories.length === 0) {
        return (
            <View className="w-full py-8 items-center">
                <ThemedText className="text-sm text-center" style={{ color: colors.textMuted }}>
                    No categories available.{'\n'}Add them in Settings → Categories.
                </ThemedText>
            </View>
        );
    }

    const rows: Category[][] = [];
    for (let i = 0; i < categories.length; i += COLUMNS) {
        rows.push(categories.slice(i, i + COLUMNS));
    }

    return (
        <View className="w-full gap-2">
            {rows.map((row, rowIndex) => (
                <View key={rowIndex} className="flex-row gap-2">
                    {row.map((category) => {
                        const isSelected = selectedCategoryId === category.id;
                        const categoryIcon = (category.icon || (category.type === 'income' ? 'wallet' : 'fast-food')) as IoniconsName;
                        const categoryColor = category.color || colors.primary;

                        return (
                            <Pressable
                                key={category.id}
                                onPress={() => onSelect(category.id)}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: isSelected }}
                                accessibilityLabel={category.name}
                                className="flex-1 rounded-xl items-center justify-center py-3 px-2 min-h-[72px]"
                                style={({ pressed }) => ({
                                    backgroundColor: isSelected ? colors.surface : pressed ? colors.backgroundAlt : 'transparent',
                                    borderWidth: isSelected ? 1.5 : 1,
                                    borderColor: isSelected ? colors.textPrimary : colors.divider,
                                })}
                            >
                                {isSelected && (
                                    <View style={{ position: 'absolute', top: 6, right: 6 }}>
                                        <Ionicons name="checkmark-circle" size={14} color={colors.textPrimary} />
                                    </View>
                                )}
                                <Ionicons name={categoryIcon} size={20} color={categoryColor} style={{ marginBottom: 6 }} />
                                <ThemedText
                                    numberOfLines={1}
                                    type="label"
                                    className="text-[12px] text-center"
                                    style={{ color: isSelected ? colors.textPrimary : colors.textSecondary }}
                                >
                                    {category.name}
                                </ThemedText>
                            </Pressable>
                        );
                    })}
                    {row.length < COLUMNS &&
                        Array.from({ length: COLUMNS - row.length }).map((_, i) => (
                            <View key={`empty-${i}`} className="flex-1" />
                        ))
                    }
                </View>
            ))}
        </View>
    );
}
