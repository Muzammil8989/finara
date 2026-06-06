import { ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

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

    // Split into rows of COLUMNS
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
                                className="flex-1 rounded-2xl items-center justify-center py-3.5 px-2"
                                style={{
                                    backgroundColor: isSelected
                                        ? categoryColor
                                        : colors.scheme === 'dark' ? colors.gray800 : colors.gray100,
                                    borderWidth: isSelected ? 0 : 1.5,
                                    borderColor: isSelected ? 'transparent' : `${categoryColor}30`,
                                }}
                            >
                                <View
                                    className="w-10 h-10 rounded-xl items-center justify-center mb-2"
                                    style={{
                                        backgroundColor: isSelected
                                            ? 'rgba(255,255,255,0.25)'
                                            : `${categoryColor}20`,
                                    }}
                                >
                                    <Ionicons
                                        name={categoryIcon}
                                        size={20}
                                        color={isSelected ? '#fff' : categoryColor}
                                    />
                                </View>
                                <ThemedText
                                    numberOfLines={1}
                                    className="text-[11px] font-black text-center"
                                    style={{ color: isSelected ? '#fff' : colors.textSecondary }}
                                >
                                    {category.name}
                                </ThemedText>
                            </Pressable>
                        );
                    })}
                    {/* Fill empty slots in last row */}
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
