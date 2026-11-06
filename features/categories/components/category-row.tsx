import { ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Category } from '@/lib/db/queries';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

/** Only the first few rows stagger in; the rest appear without animating. */
const ANIMATED_ROWS = 6;

interface CategoryRowProps {
    category: Category;
    index: number;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
}

/**
 * One category in the list. Memoized; callbacks receive the category so the
 * screen can pass stable handlers.
 */
export const CategoryRow = React.memo(function CategoryRow({ category, index, onEdit, onDelete }: CategoryRowProps) {
    const colors = useThemeColors();
    const isIncome = category.type === 'income';
    const categoryIcon = category.icon || (isIncome ? 'wallet' : 'fast-food');

    return (
        <Animated.View
            entering={index < ANIMATED_ROWS ? FadeInDown.delay(index * 50).duration(300) : undefined}
            className="bg-surface dark:bg-dark-surface border border-divider dark:border-dark-divider rounded-xl p-4"
        >
            <View className="flex-row items-center">
                <View className="w-9 h-9 items-center justify-center mr-4">
                    <Ionicons
                        name={categoryIcon as IoniconsName}
                        size={24}
                        color={category.color || (isIncome ? colors.success : colors.primary)}
                    />
                </View>
                <View className="flex-1">
                    <ThemedText className="text-lg font-bold mb-1">
                        {category.name}
                    </ThemedText>
                    <ThemedText
                        className="text-sm font-semibold"
                        style={{ color: isIncome ? colors.success : colors.error }}
                    >
                        {isIncome ? 'Income' : 'Expense'}
                    </ThemedText>
                </View>
                <View className="flex-row gap-2">
                    <Pressable
                        onPress={() => onEdit(category)}
                        className="w-10 h-10 rounded-xl items-center justify-center"
                        style={{ borderWidth: 1, borderColor: colors.borderStrong }}
                    >
                        <Ionicons name="create-outline" size={20} color={colors.primary} />
                    </Pressable>
                    <Pressable
                        onPress={() => onDelete(category)}
                        className="w-10 h-10 rounded-xl items-center justify-center"
                        style={{ borderWidth: 1, borderColor: colors.borderStrong }}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.expense} />
                    </Pressable>
                </View>
            </View>
        </Animated.View>
    );
});
