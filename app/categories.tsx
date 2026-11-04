import { AppButton, EmptyState, ScreenHeader, SegmentedControl, ThemedText } from '@/components/common';
import tokens from '@/theme/tokens';
import {
    Category,
    createCategory,
    deleteCategory,
    getCategories,
    updateCategory
} from '@/lib/db/queries';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    InteractionManager,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    TextInput,
    View
} from 'react-native';
import Animated, { Easing, FadeInDown, FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORY_COLORS: string[] = tokens.swatches;

const EXPENSE_ICONS = [
    'fast-food', 'cart', 'car', 'home', 'medical',
    'fitness', 'shirt', 'cafe', 'game-controller', 'airplane',
    'book', 'school', 'gift', 'paw', 'phone-portrait',
    'bus', 'train', 'bicycle', 'restaurant', 'pizza',
    'beer', 'film', 'musical-notes', 'barbell', 'footsteps'
] as const;

const INCOME_ICONS = [
    'cash', 'wallet', 'trending-up', 'briefcase', 'card',
    'gift', 'rocket', 'trophy', 'star', 'diamond-outline',
    'business', 'medal-outline', 'ribbon-outline', 'flash', 'bulb-outline'
] as const;

function DeleteConfirmSheet({
    category,
    onCancel,
    onConfirm,
    isDeleting,
}: {
    category: Category;
    onCancel: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
}) {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    return (
        <Modal visible animationType="fade" transparent onRequestClose={onCancel}>
            <View className="flex-1 justify-end bg-black/50">
                <Animated.View
                    entering={FadeInUp.duration(300).easing(Easing.out(Easing.cubic))}
                    exiting={FadeOutDown.duration(200).easing(Easing.in(Easing.cubic))}
                    style={{
                        backgroundColor: colors.surface,
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        paddingHorizontal: 24,
                        paddingTop: 16,
                        paddingBottom: insets.bottom + 32,
                        overflow: 'hidden',
                        borderTopWidth: 1,
                        borderColor: colors.divider,
                    }}
                >
                    <View className="w-9 h-1 bg-borderStrong dark:bg-dark-borderStrong rounded-full mx-auto mb-5" />
                    <View className="w-16 h-16 rounded-full items-center justify-center mx-auto mb-5 border border-divider dark:border-dark-divider">
                        <Ionicons name="trash-outline" size={30} color={colors.expense} />
                    </View>
                    <ThemedText type="headline" className="text-center mb-2" accessibilityRole="header">
                        Delete Category
                    </ThemedText>
                    <ThemedText className="text-[15px] text-center text-textSecondary dark:text-dark-textSecondary leading-6 mb-7 px-2">
                        Delete{' '}
                        <ThemedText className="font-bold text-textPrimary dark:text-dark-textPrimary">
                            {category.name}
                        </ThemedText>
                        ? This cannot be undone if there are transactions using this category.
                    </ThemedText>
                    <View className="flex-row gap-3">
                        <Pressable
                            onPress={onCancel}
                            className="flex-1 py-4 rounded-xl items-center border border-borderSoft dark:border-dark-borderSoft"
                            style={{ backgroundColor: colors.backgroundAlt }}
                        >
                            <ThemedText className="font-semibold text-sm">Cancel</ThemedText>
                        </Pressable>
                        <Pressable
                            onPress={onConfirm}
                            disabled={isDeleting}
                            className="flex-1 py-4 rounded-xl items-center"
                            style={{ backgroundColor: colors.expense }}
                        >
                            {isDeleting
                                ? <ActivityIndicator color={colors.white} size="small" />
                                : <ThemedText className="font-bold text-sm text-white">Delete</ThemedText>
                            }
                        </Pressable>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

export default function CategoriesScreen() {
    const insets = useSafeAreaInsets();
    const colors = useThemeColors();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState<string>('wallet');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            logger.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Defer DB fetch until the slide-in animation finishes — otherwise the
        // first render (spinner) and the second render (content) both happen
        // mid-animation and produce a visible flash.
        const task = InteractionManager.runAfterInteractions(() => {
            fetchCategories();
        });
        return () => task.cancel();
    }, [fetchCategories]);

    const openAddModal = (categoryType: 'income' | 'expense') => {
        setEditingCategory(null);
        setName('');
        setType(categoryType);
        setSelectedColor(CATEGORY_COLORS[0]);
        setSelectedIcon(categoryType === 'income' ? 'wallet' : 'fast-food');
        setModalVisible(true);
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setName(category.name);
        setType(category.type);
        setSelectedColor(category.color || CATEGORY_COLORS[0]);
        setSelectedIcon(category.icon || (category.type === 'income' ? 'wallet' : 'fast-food'));
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Please enter a category name');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, {
                    name: name.trim(),
                    type,
                    color: selectedColor,
                    icon: selectedIcon,
                });
                toast.success('Category updated');
            } else {
                await createCategory({
                    name: name.trim(),
                    type,
                    color: selectedColor,
                    icon: selectedIcon,
                });
                toast.success('Category added');
            }
            setModalVisible(false);
            fetchCategories();
        } catch (error: any) {
            logger.error('Error saving category:', error);
            if (error.message?.includes('UNIQUE constraint failed')) {
                toast.error('A category with this name already exists');
            } else {
                toast.error(error.message || 'Failed to save category');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (category: Category) => {
        setDeletingCategory(category);
    };

    const handleConfirmDelete = async () => {
        if (!deletingCategory) return;
        setIsDeleting(true);
        try {
            await deleteCategory(deletingCategory.id);
            toast.success('Category deleted');
            setDeletingCategory(null);
            fetchCategories();
        } catch (error: any) {
            logger.error('Error deleting category:', error);
            toast.error(error.message || 'Cannot delete category with transactions');
        } finally {
            setIsDeleting(false);
        }
    };

    const expenseCategories = categories.filter(c => c.type === 'expense');
    const incomeCategories = categories.filter(c => c.type === 'income');

    const renderModal = () => {
        const iconList = type === 'income' ? INCOME_ICONS : EXPENSE_ICONS;

        return (
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                    <Animated.View
                        entering={FadeInDown.duration(350)}
                        className="bg-surface dark:bg-dark-surface rounded-t-3xl px-6 pt-4 max-h-[90%]"
                        style={{ paddingBottom: insets.bottom + 40 }}
                    >
                        <View className="w-9 h-1 bg-borderStrong dark:bg-dark-borderStrong rounded-full mx-auto mb-5" />
                        <View className="flex-row justify-between items-center mb-8">
                            <ThemedText type="title" className="text-2xl font-bold">
                                {editingCategory ? 'Edit Category' : 'Add Category'}
                            </ThemedText>
                            <Pressable onPress={() => setModalVisible(false)} className="p-2">
                                <Ionicons name="close" size={24} color={colors.expense} />
                            </Pressable>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ paddingBottom: 24 }}
                        >
                            {/* Type Toggle (only when adding new) */}
                            {!editingCategory && (
                                <View className="mb-6">
                                    <View className="flex-row p-1 rounded-xl" style={{ backgroundColor: colors.backgroundAlt }}>
                                        <Pressable
                                            onPress={() => {
                                                setType('expense');
                                                setSelectedIcon('fast-food');
                                            }}
                                            className="flex-1 py-3.5 rounded-xl"
                                            style={type === 'expense' ? { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 } : undefined}
                                        >
                                            <ThemedText
                                                className="text-sm font-bold text-center"
                                                style={{ color: type === 'expense' ? colors.error : colors.textMuted }}
                                            >
                                                Expense
                                            </ThemedText>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => {
                                                setType('income');
                                                setSelectedIcon('wallet');
                                            }}
                                            className="flex-1 py-3.5 rounded-xl"
                                            style={type === 'income' ? { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 } : undefined}
                                        >
                                            <ThemedText
                                                className="text-sm font-bold text-center"
                                                style={{ color: type === 'income' ? colors.success : colors.textMuted }}
                                            >
                                                Income
                                            </ThemedText>
                                        </Pressable>
                                    </View>
                                </View>
                            )}

                            {/* Name Input */}
                            <View className="mb-6">
                                <ThemedText type="kicker" className="mb-2">
                                    Category Name
                                </ThemedText>
                                <TextInput
                                    value={name}
                                    onChangeText={setName}
                                    placeholder={type === 'income' ? 'e.g., Salary, Freelance' : 'e.g., Food, Transport'}
                                    placeholderTextColor={colors.textMuted}
                                    className="w-full rounded-xl px-6 py-4 text-textPrimary dark:text-dark-textPrimary text-base font-semibold"
                                    style={{ backgroundColor: colors.backgroundAlt, fontFamily: 'PlusJakartaSans_600SemiBold' }}
                                />
                            </View>

                            {/* Icon Selection */}
                            <View className="mb-6">
                                <ThemedText type="kicker" className="mb-3">
                                    Icon
                                </ThemedText>
                                <View className="flex-row flex-wrap gap-3">
                                    {iconList.map((icon) => (
                                        <Pressable
                                            key={icon}
                                            onPress={() => setSelectedIcon(icon)}
                                            className="w-14 h-14 rounded-xl items-center justify-center"
                                            style={{ backgroundColor: selectedIcon === icon ? colors.primary : colors.backgroundAlt }}
                                        >
                                            <Ionicons
                                                name={icon}
                                                size={24}
                                                color={selectedIcon === icon ? colors.white : colors.textMuted}
                                            />
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            {/* Color Selection */}
                            <View className="mb-8">
                                <ThemedText type="kicker" className="mb-3">
                                    Color
                                </ThemedText>
                                <View className="flex-row flex-wrap gap-3">
                                    {CATEGORY_COLORS.map((color) => (
                                        <Pressable
                                            key={color}
                                            onPress={() => setSelectedColor(color)}
                                            accessibilityRole="radio"
                                            accessibilityState={{ selected: selectedColor === color }}
                                            className="w-14 h-14 rounded-xl items-center justify-center"
                                            style={{
                                                backgroundColor: color,
                                                borderWidth: selectedColor === color ? 3 : 0,
                                                borderColor: colors.textPrimary,
                                            }}
                                        >
                                            {selectedColor === color && (
                                                <Ionicons name="checkmark" size={24} color={colors.white} />
                                            )}
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            <AppButton
                                label={`${editingCategory ? 'Update' : 'Add'} Category`}
                                onPress={handleSave}
                                loading={isSubmitting}
                                disabled={isSubmitting}
                                color={type === 'income' ? colors.success : colors.error}
                            />
                        </ScrollView>
                    </Animated.View>
                </KeyboardAvoidingView>
            </Modal>
        );
    };

    const renderCategoryList = (categoryList: Category[], categoryType: 'income' | 'expense') => {
        if (categoryList.length === 0) {
            return (
                <EmptyState
                    icon={categoryType === 'income' ? 'trending-up-outline' : 'wallet-outline'}
                    title={`No ${categoryType === 'income' ? 'Income' : 'Expense'} Categories`}
                    subtitle={`Add your first ${categoryType} category to get started.`}
                    actionLabel="Add Category"
                    onAction={() => openAddModal(categoryType)}
                    iconColor={categoryType === 'income' ? colors.success : colors.error}
                    actionColor={categoryType === 'income' ? colors.success : colors.error}
                />
            );
        }

        return (
            <View className="gap-3 px-5">
                {categoryList.map((category, index) => {
                    const categoryIcon = category.icon || (categoryType === 'income' ? 'wallet' : 'fast-food');
                    return (
                        <Animated.View
                            key={category.id}
                            entering={FadeInDown.delay(index * 50).springify()}
                            className="bg-surface dark:bg-dark-surface border border-divider dark:border-dark-divider rounded-xl p-4"
                        >
                            <View className="flex-row items-center">
                                <View className="w-9 h-9 items-center justify-center mr-4">
                                    <Ionicons
                                        name={categoryIcon as IoniconsName}
                                        size={24}
                                        color={category.color || (categoryType === 'income' ? colors.success : colors.primary)}
                                    />
                                </View>
                                <View className="flex-1">
                                    <ThemedText className="text-lg font-bold mb-1">
                                        {category.name}
                                    </ThemedText>
                                    <ThemedText
                                        className="text-sm font-semibold"
                                        style={{ color: categoryType === 'income' ? colors.success : colors.error }}
                                    >
                                        {categoryType === 'income' ? 'Income' : 'Expense'}
                                    </ThemedText>
                                </View>
                                <View className="flex-row gap-2">
                                    <Pressable
                                        onPress={() => openEditModal(category)}
                                        className="w-10 h-10 rounded-xl items-center justify-center"
                                        style={{ borderWidth: 1, borderColor: colors.borderStrong }}
                                    >
                                        <Ionicons name="create-outline" size={20} color={colors.primary} />
                                    </Pressable>
                                    <Pressable
                                        onPress={() => handleDelete(category)}
                                        className="w-10 h-10 rounded-xl items-center justify-center"
                                        style={{ borderWidth: 1, borderColor: colors.borderStrong }}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={colors.expense} />
                                    </Pressable>
                                </View>
                            </View>
                        </Animated.View>
                    );
                })}
            </View>
        );
    };

    return (
        <View className="flex-1 bg-background dark:bg-dark-background">
            <ScrollView
                className="flex-1"
                style={{ paddingTop: insets.top }}
                contentContainerStyle={{ paddingBottom: 100 }}
                contentInsetAdjustmentBehavior="automatic"
            >
                <ScreenHeader
                    title="Categories"
                    right={
                        <Pressable
                            onPress={() => openAddModal(activeTab)}
                            className="w-11 h-11 rounded-xl items-center justify-center"
                            style={{ backgroundColor: activeTab === 'income' ? colors.success : colors.error }}
                        >
                            <Ionicons name="add" size={26} color={colors.white} />
                        </Pressable>
                    }
                />

                {/* Tabs */}
                <SegmentedControl
                    options={[
                        { key: 'expense', label: `Expense (${expenseCategories.length})` },
                        { key: 'income', label: `Income (${incomeCategories.length})` },
                    ]}
                    value={activeTab}
                    onChange={setActiveTab}
                    className="mx-5 mb-5"
                />

                {/* Categories List */}
                {loading ? (
                    <View className="py-20 items-center">
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <>
                        {activeTab === 'expense'
                            ? renderCategoryList(expenseCategories, 'expense')
                            : renderCategoryList(incomeCategories, 'income')}
                    </>
                )}
            </ScrollView>

            {renderModal()}
            {deletingCategory && (
                <DeleteConfirmSheet
                    category={deletingCategory}
                    onCancel={() => setDeletingCategory(null)}
                    onConfirm={handleConfirmDelete}
                    isDeleting={isDeleting}
                />
            )}
        </View>
    );
}
