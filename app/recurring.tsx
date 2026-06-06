import { AppButton, EmptyState, ScreenHeader, ThemedText } from '@/components/common';
import { CategoryChips } from '@/features/transactions/components/category-chips';
import { useAccounts } from '@/features/accounts/hooks/use-accounts';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useUser } from '@/features/user/context/user-context';
import {
    createRecurringExpense,
    deleteRecurringExpense,
    getRecurringExpensesWithDetails,
    updateRecurringExpense,
} from '@/lib/db/queries';
import { formatWithCommas, numberToWords } from '@/lib/utils/currency';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import { UserService } from '@/features/user/services/user-service';
import { useModals } from '@/context/modal-context';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
    View,
} from 'react-native';
import Animated, { Easing, FadeInDown, FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface RecurringItem {
    id: number;
    amount: number;
    frequency: RecurringFrequency;
    start_date: string;
    end_date: string | null;
    notes: string | null;
    is_active: number | null;
    category_id: number;
    account_id: number;
    categoryName: string | null;
    categoryIcon: string | null;
    categoryColor: string | null;
    categoryType: string | null;
    accountName: string | null;
}

const FREQUENCY_LABELS: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
};

function DeleteConfirmSheet({
    item,
    onCancel,
    onConfirm,
    isDeleting,
}: {
    item: RecurringItem;
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
                        borderTopLeftRadius: 40,
                        borderTopRightRadius: 40,
                        paddingHorizontal: 28,
                        paddingTop: 36,
                        paddingBottom: insets.bottom + 32,
                        overflow: 'hidden',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 20,
                        elevation: 24,
                    }}
                >
                    <LinearGradient
                        colors={[`${colors.error}18`, `${colors.error}08`, 'transparent']}
                        className="absolute top-0 left-0 right-0 h-40"
                    />
                    <View className="w-12 h-1.5 bg-borderStrong dark:bg-dark-borderStrong rounded-full mx-auto mb-8" />
                    <View className="w-16 h-16 items-center justify-center mx-auto mb-5">
                        <Ionicons name="trash-outline" size={32} color={colors.error} />
                    </View>
                    <ThemedText className="text-xl font-bold text-center mb-2">
                        Delete Recurring
                    </ThemedText>
                    <ThemedText className="text-sm text-center text-textMuted dark:text-dark-textMuted leading-6 mb-8 px-4">
                        Delete{' '}
                        <ThemedText className="font-bold text-textPrimary dark:text-dark-textPrimary">
                            {item.categoryName}
                        </ThemedText>
                        {' '}recurring {item.categoryType === 'income' ? 'income' : 'expense'}? This cannot be undone.
                    </ThemedText>
                    <View className="flex-row gap-3">
                        <AppButton label="Cancel" onPress={onCancel} variant="secondary" flex />
                        <AppButton label="Delete" onPress={onConfirm} variant="destructive" loading={isDeleting} disabled={isDeleting} flex />
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

function ToggleConfirmSheet({
    item,
    onCancel,
    onConfirm,
    isLoading,
}: {
    item: RecurringItem;
    onCancel: () => void;
    onConfirm: () => void;
    isLoading: boolean;
}) {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const isPaused = item.is_active !== 1;
    const actionColor = isPaused ? colors.success : colors.warning;
    return (
        <Modal visible animationType="fade" transparent onRequestClose={onCancel}>
            <View className="flex-1 justify-end bg-black/50">
                <Animated.View
                    entering={FadeInUp.duration(300).easing(Easing.out(Easing.cubic))}
                    exiting={FadeOutDown.duration(200).easing(Easing.in(Easing.cubic))}
                    style={{
                        backgroundColor: colors.surface,
                        borderTopLeftRadius: 40,
                        borderTopRightRadius: 40,
                        paddingHorizontal: 28,
                        paddingTop: 36,
                        paddingBottom: insets.bottom + 32,
                        overflow: 'hidden',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 20,
                        elevation: 24,
                    }}
                >
                    <LinearGradient
                        colors={[`${actionColor}20`, `${actionColor}08`, 'transparent']}
                        className="absolute top-0 left-0 right-0 h-40"
                    />
                    <View className="w-12 h-1.5 bg-borderStrong dark:bg-dark-borderStrong rounded-full mx-auto mb-8" />
                    <View className="w-16 h-16 items-center justify-center mx-auto mb-5">
                        <Ionicons name={isPaused ? 'play' : 'pause'} size={32} color={actionColor} />
                    </View>
                    <ThemedText className="text-xl font-bold text-center mb-2">
                        {isPaused ? 'Resume' : 'Pause'} Recurring
                    </ThemedText>
                    <ThemedText className="text-sm text-center text-textMuted dark:text-dark-textMuted leading-6 mb-8 px-4">
                        {isPaused ? 'Resume' : 'Pause'}{' '}
                        <ThemedText className="font-bold text-textPrimary dark:text-dark-textPrimary">
                            {item.categoryName}
                        </ThemedText>
                        {' '}recurring {item.categoryType === 'income' ? 'income' : 'expense'}?
                    </ThemedText>
                    <View className="flex-row gap-3">
                        <AppButton label="Cancel" onPress={onCancel} variant="secondary" flex />
                        <AppButton label={isPaused ? 'Resume' : 'Pause'} onPress={onConfirm} color={actionColor} loading={isLoading} disabled={isLoading} flex />
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

export default function RecurringScreen() {
    const insets = useSafeAreaInsets();
    const colors = useThemeColors();
    const { profile } = useUser();
    const { categories } = useCategories();
    const { accounts } = useAccounts();
    const { triggerRefresh } = useModals();

    const [items, setItems] = useState<RecurringItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

    // Add modal state
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [addAmount, setAddAmount] = useState('');
    const [addFrequency, setAddFrequency] = useState<RecurringFrequency>('monthly');
    const [addCategoryId, setAddCategoryId] = useState<number | null>(null);
    const [addAccountId, setAddAccountId] = useState<number | null>(null);
    const [addNotes, setAddNotes] = useState('');

    // Edit modal state
    const [editItem, setEditItem] = useState<RecurringItem | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editFrequency, setEditFrequency] = useState<RecurringFrequency>('monthly');
    const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
    const [editAccountId, setEditAccountId] = useState<number | null>(null);
    const [editNotes, setEditNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingItem, setDeletingItem] = useState<RecurringItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [togglingItem, setTogglingItem] = useState<RecurringItem | null>(null);
    const [isToggling, setIsToggling] = useState(false);

    const currencySymbol = UserService.getCurrencySymbol(profile.currency);

    const mountedRef = React.useRef(true);
    React.useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getRecurringExpensesWithDetails();
            if (!mountedRef.current) return;
            setItems(data);
        } catch (error) {
            if (!mountedRef.current) return;
            logger.error('Error fetching recurring items:', error);
            toast.error('Failed to load recurring items');
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Defer DB fetch until after the slide-in animation so the screen
        // doesn't re-render mid-animation (spinner → content flash).
        const task = InteractionManager.runAfterInteractions(() => {
            fetchItems();
        });
        return () => task.cancel();
    }, [fetchItems]);

    const openAddModal = () => {
        setAddAmount('');
        setAddFrequency('monthly');
        setAddCategoryId(null);
        setAddAccountId(accounts?.[0]?.id ?? null);
        setAddNotes('');
        setAddModalVisible(true);
    };

    const handleAdd = async () => {
        const parsedAmount = parseFloat(addAmount);
        if (!addAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        if (!addCategoryId) {
            toast.error('Please select a category');
            return;
        }
        if (!addAccountId) {
            toast.error('Please select a payment method');
            return;
        }

        setIsSubmitting(true);
        try {
            await createRecurringExpense({
                amount: parsedAmount,
                frequency: addFrequency,
                category_id: addCategoryId,
                account_id: addAccountId,
                start_date: new Date().toISOString().split('T')[0],
                notes: addNotes.trim() || undefined,
                is_active: 1,
            });
            toast.success('Recurring item added');
            setAddModalVisible(false);
            fetchItems();
            triggerRefresh();
        } catch (error) {
            logger.error('Error creating recurring item:', error);
            toast.error('Failed to add');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (item: RecurringItem) => {
        setEditItem(item);
        setEditAmount(item.amount.toString());
        setEditFrequency(item.frequency);
        setEditCategoryId(item.category_id);
        setEditAccountId(item.account_id);
        setEditNotes(item.notes || '');
    };

    const handleSave = async () => {
        if (!editItem) return;
        const parsedAmount = parseFloat(editAmount);
        if (!editAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        if (!editCategoryId) {
            toast.error('Please select a category');
            return;
        }
        if (!editAccountId) {
            toast.error('Please select a payment method');
            return;
        }

        setIsSubmitting(true);
        try {
            await updateRecurringExpense(editItem.id, {
                amount: parsedAmount,
                frequency: editFrequency,
                category_id: editCategoryId,
                account_id: editAccountId,
                notes: editNotes.trim() || undefined,
            });
            toast.success('Recurring item updated');
            setEditItem(null);
            fetchItems();
            triggerRefresh();
        } catch (error) {
            logger.error('Error updating recurring item:', error);
            toast.error('Failed to update');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = (item: RecurringItem) => {
        setTogglingItem(item);
    };

    const handleConfirmToggle = async () => {
        if (!togglingItem) return;
        const newActive = togglingItem.is_active === 1 ? 0 : 1;
        setIsToggling(true);
        try {
            await updateRecurringExpense(togglingItem.id, { is_active: newActive });
            toast.success(`Recurring item ${newActive === 1 ? 'resumed' : 'paused'}`);
            setTogglingItem(null);
            fetchItems();
        } catch (error) {
            logger.error('Error toggling recurring item:', error);
            toast.error('Failed to update');
        } finally {
            setIsToggling(false);
        }
    };

    const handleDelete = (item: RecurringItem) => {
        setDeletingItem(item);
    };

    const handleConfirmDelete = async () => {
        if (!deletingItem) return;
        setIsDeleting(true);
        try {
            await deleteRecurringExpense(deletingItem.id);
            toast.success('Recurring item deleted');
            setDeletingItem(null);
            fetchItems();
        } catch (error) {
            logger.error('Error deleting recurring item:', error);
            toast.error('Failed to delete');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredItems = items.filter(i => i.categoryType === activeTab);

    const renderEditModal = () => {
        if (!editItem) return null;

        const isIncome = editItem.categoryType === 'income';
        const filteredCategories = (categories || []).filter(c => c?.type === editItem.categoryType);

        return (
            <Modal visible={!!editItem} animationType="slide" transparent onRequestClose={() => setEditItem(null)}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                    <Animated.View
                        entering={FadeInDown.duration(350)}
                        style={{
                            backgroundColor: colors.surface,
                            borderTopLeftRadius: 40,
                            borderTopRightRadius: 40,
                            paddingHorizontal: 32,
                            paddingTop: 40,
                            paddingBottom: insets.bottom + 40,
                            maxHeight: '90%',
                            overflow: 'hidden',
                        }}
                    >
                        <LinearGradient
                            colors={[`${colors.primary}1A`, `${colors.primary}08`, 'transparent']}
                            className="absolute top-0 left-0 right-0 h-[35%]"
                        />
                        <View className="flex-row justify-between items-center mb-8">
                            <View className="flex-row items-center gap-3">
                                <Ionicons name="repeat" size={22} color={isIncome ? colors.success : colors.error} />
                                <ThemedText className="text-xl font-bold">Edit Recurring</ThemedText>
                            </View>
                            <Pressable onPress={() => setEditItem(null)} className="p-2">
                                <Ionicons name="close" size={24} color={colors.error} />
                            </Pressable>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ paddingBottom: 24 }}
                        >
                            {/* Amount */}
                            <View className="mb-6">
                                <ThemedText className="text-[10px] font-bold uppercase mb-2" style={{ color: colors.textMuted }}>Amount</ThemedText>
                                <View className="flex-row items-center rounded-2xl px-6 py-4" style={{ backgroundColor: colors.backgroundAlt }}>
                                    <ThemedText className="text-lg font-bold mr-2" style={{ color: colors.textMuted }}>{currencySymbol}</ThemedText>
                                    <TextInput
                                        value={editAmount}
                                        onChangeText={setEditAmount}
                                        keyboardType="decimal-pad"
                                        placeholder="0.00"
                                        placeholderTextColor={colors.textMuted}
                                        className="flex-1 text-lg font-bold"
                                        style={{ color: colors.textPrimary, fontFamily: 'SpaceGrotesk_700Bold' }}
                                    />
                                </View>
                                {!!editAmount && !isNaN(parseFloat(editAmount)) && parseFloat(editAmount) > 0 && (
                                    <View className="items-center mt-2 gap-0.5">
                                        <ThemedText className="text-sm font-bold" style={{ color: colors.primary }}>
                                            {formatWithCommas(editAmount)}
                                        </ThemedText>
                                        <ThemedText className="text-xs font-medium" style={{ color: colors.textMuted }}>
                                            {numberToWords(parseFloat(editAmount))}
                                        </ThemedText>
                                    </View>
                                )}
                            </View>

                            {/* Frequency */}
                            <View className="mb-6">
                                <ThemedText className="text-[10px] font-bold uppercase mb-3" style={{ color: colors.textMuted }}>Frequency</ThemedText>
                                <View className="flex-row gap-2">
                                    {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(freq => (
                                        <Pressable
                                            key={freq}
                                            onPress={() => setEditFrequency(freq)}
                                            className="flex-1 py-3 rounded-xl items-center"
                                            style={{
                                                backgroundColor: editFrequency === freq ? colors.primary : colors.backgroundAlt,
                                            }}
                                        >
                                            <ThemedText
                                                className="text-xs font-bold"
                                                style={{ color: editFrequency === freq ? colors.white : colors.textSecondary }}
                                            >
                                                {FREQUENCY_LABELS[freq]}
                                            </ThemedText>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            {/* Category */}
                            <View className="mb-6">
                                <ThemedText className="text-[10px] font-bold uppercase mb-3" style={{ color: colors.textMuted }}>Category</ThemedText>
                                <CategoryChips
                                    categories={filteredCategories}
                                    selectedCategoryId={editCategoryId}
                                    onSelect={setEditCategoryId}
                                />
                            </View>

                            {/* Account */}
                            <View className="mb-6">
                                <ThemedText className="text-[10px] font-bold uppercase mb-3" style={{ color: colors.textMuted }}>Payment Method</ThemedText>
                                <View className="flex-row flex-wrap gap-2">
                                    {(accounts || []).map(acc => {
                                        if (!acc?.id) return null;
                                        const isSelected = editAccountId === acc.id;
                                        return (
                                            <Pressable
                                                key={acc.id}
                                                onPress={() => setEditAccountId(acc.id)}
                                                className="px-4 py-3 rounded-xl flex-row items-center gap-2"
                                                style={{
                                                    backgroundColor: isSelected ? colors.primary : colors.backgroundAlt,
                                                    borderWidth: isSelected ? 0 : 1,
                                                    borderColor: isSelected ? 'transparent' : colors.borderSoft,
                                                }}
                                            >
                                                <Ionicons name={(acc.icon || 'wallet') as IoniconsName} size={16} color={isSelected ? colors.white : (acc.color || colors.textMuted)} />
                                                <ThemedText className="text-sm font-bold" style={{ color: isSelected ? colors.white : colors.textSecondary }}>
                                                    {acc.name}
                                                </ThemedText>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Notes */}
                            <View className="mb-8">
                                <ThemedText className="text-[10px] font-bold uppercase mb-2" style={{ color: colors.textMuted }}>Note</ThemedText>
                                <TextInput
                                    value={editNotes}
                                    onChangeText={setEditNotes}
                                    placeholder="Description..."
                                    placeholderTextColor={colors.textMuted}
                                    multiline
                                    numberOfLines={2}
                                    className="w-full rounded-xl py-3 px-4 text-sm font-bold"
                                    style={{ color: colors.textPrimary, backgroundColor: colors.backgroundAlt, fontFamily: 'PlusJakartaSans_700Bold' }}
                                />
                            </View>

                            <AppButton
                                label="Update Recurring"
                                onPress={handleSave}
                                loading={isSubmitting}
                                disabled={isSubmitting}
                            />
                        </ScrollView>
                    </Animated.View>
                </KeyboardAvoidingView>
            </Modal>
        );
    };

    const renderAddModal = () => {
        const addCategories = (categories || []).filter(c => c?.type === activeTab);

        return (
            <Modal visible={addModalVisible} animationType="slide" transparent onRequestClose={() => setAddModalVisible(false)}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                    <Animated.View
                        entering={FadeInDown.duration(350)}
                        style={{
                            backgroundColor: colors.surface,
                            borderTopLeftRadius: 40,
                            borderTopRightRadius: 40,
                            paddingHorizontal: 32,
                            paddingTop: 40,
                            paddingBottom: insets.bottom + 40,
                            maxHeight: '90%',
                            overflow: 'hidden',
                        }}
                    >
                        <LinearGradient
                            colors={[`${colors.primary}1A`, `${colors.primary}08`, 'transparent']}
                            className="absolute top-0 left-0 right-0 h-[35%]"
                        />
                        <View className="flex-row justify-between items-center mb-8">
                            <View className="flex-row items-center gap-3">
                                <Ionicons name="repeat" size={22} color={activeTab === 'income' ? colors.success : colors.error} />
                                <ThemedText className="text-xl font-bold">
                                    New {activeTab === 'income' ? 'Income' : 'Expense'}
                                </ThemedText>
                            </View>
                            <Pressable onPress={() => setAddModalVisible(false)} className="p-2">
                                <Ionicons name="close" size={24} color={colors.error} />
                            </Pressable>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ paddingBottom: 24 }}
                        >
                            {/* Amount */}
                            <View className="mb-6">
                                <ThemedText className="text-[10px] font-bold uppercase mb-2" style={{ color: colors.textMuted }}>Amount</ThemedText>
                                <View className="flex-row items-center rounded-2xl px-6 py-4" style={{ backgroundColor: colors.backgroundAlt }}>
                                    <ThemedText className="text-lg font-bold mr-2" style={{ color: colors.textMuted }}>{currencySymbol}</ThemedText>
                                    <TextInput
                                        value={addAmount}
                                        onChangeText={setAddAmount}
                                        keyboardType="decimal-pad"
                                        placeholder="0.00"
                                        placeholderTextColor={colors.textMuted}
                                        className="flex-1 text-lg font-bold"
                                        style={{ color: colors.textPrimary, fontFamily: 'SpaceGrotesk_700Bold' }}
                                    />
                                </View>
                                {!!addAmount && !isNaN(parseFloat(addAmount)) && parseFloat(addAmount) > 0 && (
                                    <View className="items-center mt-2 gap-0.5">
                                        <ThemedText className="text-sm font-bold" style={{ color: colors.primary }}>
                                            {formatWithCommas(addAmount)}
                                        </ThemedText>
                                        <ThemedText className="text-xs font-medium" style={{ color: colors.textMuted }}>
                                            {numberToWords(parseFloat(addAmount))}
                                        </ThemedText>
                                    </View>
                                )}
                            </View>

                            {/* Frequency */}
                            <View className="mb-6">
                                <ThemedText className="text-[10px] font-bold uppercase mb-3" style={{ color: colors.textMuted }}>Frequency</ThemedText>
                                <View className="flex-row gap-2">
                                    {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(freq => (
                                        <Pressable
                                            key={freq}
                                            onPress={() => setAddFrequency(freq)}
                                            className="flex-1 py-3 rounded-xl items-center"
                                            style={{
                                                backgroundColor: addFrequency === freq ? colors.primary : colors.backgroundAlt,
                                            }}
                                        >
                                            <ThemedText
                                                className="text-xs font-bold"
                                                style={{ color: addFrequency === freq ? colors.white : colors.textSecondary }}
                                            >
                                                {FREQUENCY_LABELS[freq]}
                                            </ThemedText>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            {/* Category */}
                            <View className="mb-6">
                                <ThemedText className="text-[10px] font-bold uppercase mb-3" style={{ color: colors.textMuted }}>Category</ThemedText>
                                <CategoryChips
                                    categories={addCategories}
                                    selectedCategoryId={addCategoryId}
                                    onSelect={setAddCategoryId}
                                />
                            </View>

                            {/* Account */}
                            <View className="mb-6">
                                <ThemedText className="text-[10px] font-bold uppercase mb-3" style={{ color: colors.textMuted }}>Payment Method</ThemedText>
                                <View className="flex-row flex-wrap gap-2">
                                    {(accounts || []).map(acc => {
                                        if (!acc?.id) return null;
                                        const isSelected = addAccountId === acc.id;
                                        return (
                                            <Pressable
                                                key={acc.id}
                                                onPress={() => setAddAccountId(acc.id)}
                                                className="px-4 py-3 rounded-xl flex-row items-center gap-2"
                                                style={{
                                                    backgroundColor: isSelected ? colors.primary : colors.backgroundAlt,
                                                    borderWidth: isSelected ? 0 : 1,
                                                    borderColor: isSelected ? 'transparent' : colors.borderSoft,
                                                }}
                                            >
                                                <Ionicons name={(acc.icon || 'wallet') as IoniconsName} size={16} color={isSelected ? colors.white : (acc.color || colors.textMuted)} />
                                                <ThemedText className="text-sm font-bold" style={{ color: isSelected ? colors.white : colors.textSecondary }}>
                                                    {acc.name}
                                                </ThemedText>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Notes */}
                            <View className="mb-8">
                                <ThemedText className="text-[10px] font-bold uppercase mb-2" style={{ color: colors.textMuted }}>Note</ThemedText>
                                <TextInput
                                    value={addNotes}
                                    onChangeText={setAddNotes}
                                    placeholder="Description..."
                                    placeholderTextColor={colors.textMuted}
                                    multiline
                                    numberOfLines={2}
                                    className="w-full rounded-xl py-3 px-4 text-sm font-bold"
                                    style={{ color: colors.textPrimary, backgroundColor: colors.backgroundAlt, fontFamily: 'PlusJakartaSans_700Bold' }}
                                />
                            </View>

                            <AppButton
                                label={`Add Recurring ${activeTab === 'income' ? 'Income' : 'Expense'}`}
                                onPress={handleAdd}
                                loading={isSubmitting}
                                disabled={isSubmitting}
                                color={activeTab === 'income' ? colors.success : colors.error}
                            />
                        </ScrollView>
                    </Animated.View>
                </KeyboardAvoidingView>
            </Modal>
        );
    };

    const renderItem = (item: RecurringItem, index: number) => {
        const isIncome = item.categoryType === 'income';
        const isPaused = item.is_active !== 1;
        const icon = item.categoryIcon || (isIncome ? 'wallet' : 'fast-food');
        const color = item.categoryColor || colors.primary;

        return (
            <View
                key={item.id}
                style={{
                    opacity: isPaused ? 0.55 : 1,
                    marginBottom: 16,
                }}
            >
                <Animated.View
                    entering={FadeInDown.delay(index * 50).springify()}
                    style={{
                        backgroundColor: colors.backgroundAlt,
                        borderRadius: 24,
                        padding: 20,
                    }}
                >
                <View className="flex-row items-center mb-4">
                    <View
                        className="mr-4 items-center justify-center"
                        style={{ width: 36, height: 36 }}
                    >
                        <Ionicons name={icon as IoniconsName} size={24} color={color} />
                    </View>
                    <View className="flex-1">
                        <ThemedText className="text-lg font-bold mb-0.5">
                            {item.categoryName || 'Unknown'}
                        </ThemedText>
                        <View className="flex-row items-center gap-2">
                            <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: isIncome ? `${colors.success}20` : `${colors.error}20` }}>
                                <ThemedText className="text-[10px] font-bold" style={{ color: isIncome ? colors.success : colors.error }}>
                                    {isIncome ? 'INCOME' : 'EXPENSE'}
                                </ThemedText>
                            </View>
                            <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: `${colors.primary}15` }}>
                                <ThemedText className="text-[10px] font-bold" style={{ color: colors.primary }}>
                                    {FREQUENCY_LABELS[item.frequency] || item.frequency}
                                </ThemedText>
                            </View>
                            {isPaused && (
                                <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: `${colors.warning}20` }}>
                                    <ThemedText className="text-[10px] font-bold" style={{ color: colors.warning }}>PAUSED</ThemedText>
                                </View>
                            )}
                        </View>
                    </View>
                    <ThemedText className="text-lg font-bold" style={{ color: isIncome ? colors.success : colors.error, fontFamily: 'SpaceGrotesk_700Bold' }}>
                        {isIncome ? '+' : '-'}{UserService.formatCurrency(item.amount, profile.currency)}
                    </ThemedText>
                </View>

                {/* Info row */}
                <View className="flex-row items-center mb-4 pl-[52px]">
                    {item.accountName && (
                        <View className="flex-row items-center mr-4">
                            <Ionicons name="wallet-outline" size={12} color={colors.textMuted} />
                            <ThemedText className="text-xs ml-1" style={{ color: colors.textMuted }}>{item.accountName}</ThemedText>
                        </View>
                    )}
                    {item.notes && (
                        <View className="flex-row items-center flex-1">
                            <Ionicons name="document-text-outline" size={12} color={colors.textMuted} />
                            <ThemedText className="text-xs ml-1 flex-1" style={{ color: colors.textMuted }} numberOfLines={1}>{item.notes}</ThemedText>
                        </View>
                    )}
                </View>

                {/* Action buttons */}
                <View className="flex-row gap-2 pl-[52px]">
                    <Pressable
                        onPress={() => openEditModal(item)}
                        className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl"
                        style={{ backgroundColor: `${colors.primary}10` }}
                    >
                        <Ionicons name="create-outline" size={16} color={colors.primary} />
                        <ThemedText className="text-xs font-bold" style={{ color: colors.primary }}>Edit</ThemedText>
                    </Pressable>
                    <Pressable
                        onPress={() => handleToggleActive(item)}
                        className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl"
                        style={{ backgroundColor: isPaused ? `${colors.success}10` : `${colors.warning}10` }}
                    >
                        <Ionicons name={isPaused ? 'play' : 'pause'} size={16} color={isPaused ? colors.success : colors.warning} />
                        <ThemedText className="text-xs font-bold" style={{ color: isPaused ? colors.success : colors.warning }}>
                            {isPaused ? 'Resume' : 'Pause'}
                        </ThemedText>
                    </Pressable>
                    <Pressable
                        onPress={() => handleDelete(item)}
                        className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl"
                        style={{ backgroundColor: `${colors.error}10` }}
                    >
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                        <ThemedText className="text-xs font-bold" style={{ color: colors.error }}>Delete</ThemedText>
                    </Pressable>
                </View>
            </Animated.View>
            </View>
        );
    };

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <LinearGradient
                colors={[`${colors.primary}1A`, `${colors.primary}0D`, 'transparent']}
                className="absolute top-0 left-0 right-0 h-[30%]"
            />
            <ScrollView
                className="flex-1"
                style={{ paddingTop: insets.top }}
                contentContainerStyle={{ paddingBottom: 100 }}
                contentInsetAdjustmentBehavior="automatic"
            >
                <ScreenHeader
                    title="Subscriptions & Bills"
                    right={
                        <Pressable
                            onPress={openAddModal}
                            className="w-11 h-11 rounded-2xl items-center justify-center"
                            style={{ backgroundColor: colors.primary }}
                        >
                            <Ionicons name="add" size={26} color={colors.white} />
                        </Pressable>
                    }
                />

                {/* Expense / Income Tabs */}
                <View className="px-6 mb-6">
                    <View className="flex-row rounded-2xl p-1" style={{ backgroundColor: colors.backgroundAlt }}>
                        <Pressable
                            onPress={() => setActiveTab('expense')}
                            className="flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2"
                            style={{
                                backgroundColor: activeTab === 'expense' ? colors.surface : 'transparent',
                                shadowColor: activeTab === 'expense' ? '#000' : 'transparent',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: activeTab === 'expense' ? 0.08 : 0,
                                shadowRadius: 8,
                                elevation: activeTab === 'expense' ? 3 : 0,
                            }}
                        >
                            <Ionicons name="trending-down" size={16} color={activeTab === 'expense' ? colors.error : colors.textMuted} />
                            <ThemedText className="text-sm font-bold" style={{ color: activeTab === 'expense' ? colors.error : colors.textMuted }}>
                                Expenses
                            </ThemedText>
                        </Pressable>
                        <Pressable
                            onPress={() => setActiveTab('income')}
                            className="flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2"
                            style={{
                                backgroundColor: activeTab === 'income' ? colors.surface : 'transparent',
                                shadowColor: activeTab === 'income' ? '#000' : 'transparent',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: activeTab === 'income' ? 0.08 : 0,
                                shadowRadius: 8,
                                elevation: activeTab === 'income' ? 3 : 0,
                            }}
                        >
                            <Ionicons name="trending-up" size={16} color={activeTab === 'income' ? colors.success : colors.textMuted} />
                            <ThemedText className="text-sm font-bold" style={{ color: activeTab === 'income' ? colors.success : colors.textMuted }}>
                                Income
                            </ThemedText>
                        </Pressable>
                    </View>
                </View>

                {loading ? (
                    <View className="py-20 items-center">
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : filteredItems.length === 0 ? (
                    <EmptyState
                        icon={activeTab === 'income' ? 'trending-up-outline' : 'trending-down-outline'}
                        title={`No Recurring ${activeTab === 'income' ? 'Income' : 'Expenses'}`}
                        subtitle={`Your recurring ${activeTab === 'income' ? 'income' : 'expenses'} will appear here.`}
                    />
                ) : (
                    <View className="px-6">
                        {filteredItems.map((item, i) => renderItem(item, i))}
                    </View>
                )}
            </ScrollView>

            {renderAddModal()}
            {renderEditModal()}
            {deletingItem && (
                <DeleteConfirmSheet
                    item={deletingItem}
                    onCancel={() => setDeletingItem(null)}
                    onConfirm={handleConfirmDelete}
                    isDeleting={isDeleting}
                />
            )}
            {togglingItem && (
                <ToggleConfirmSheet
                    item={togglingItem}
                    onCancel={() => setTogglingItem(null)}
                    onConfirm={handleConfirmToggle}
                    isLoading={isToggling}
                />
            )}
        </View>
    );
}
