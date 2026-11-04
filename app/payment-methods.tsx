import { parseAmount } from '@/lib/utils/currency';
import tokens from '@/theme/tokens';
import { AppButton, EmptyState, ScreenHeader, ThemedText } from '@/components/common';
import { useUser } from '@/features/user/context/user-context';
import { UserService } from '@/features/user/services/user-service';
import {
    AccountWithBalance,
    createAccount,
    deleteAccount,
    getAccountsWithBalance,
    updateAccount
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

type AccountType = 'checking' | 'savings' | 'credit' | 'cash' | 'other';

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: IoniconsName }[] = [
    { value: 'checking', label: 'Checking', icon: 'card' },
    { value: 'savings', label: 'Savings', icon: 'wallet' },
    { value: 'credit', label: 'Credit Card', icon: 'card-outline' },
    { value: 'cash', label: 'Cash', icon: 'cash' },
    { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-circle' },
];

const ACCOUNT_COLORS: string[] = tokens.swatches;

const ACCOUNT_ICONS = [
    'wallet', 'card', 'cash', 'business', 'briefcase',
    'gift', 'home', 'planet', 'rocket', 'shield'
] as const;

function DeleteConfirmSheet({
    account,
    onCancel,
    onConfirm,
    isDeleting,
}: {
    account: AccountWithBalance;
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
                        Delete Account
                    </ThemedText>
                    <ThemedText className="text-[15px] text-center text-textSecondary dark:text-dark-textSecondary leading-6 mb-7 px-2">
                        Delete{' '}
                        <ThemedText className="font-bold text-textPrimary dark:text-dark-textPrimary">
                            {account.name}
                        </ThemedText>
                        ? This cannot be undone if there are associated transactions.
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

export default function PaymentMethodsScreen() {
    const insets = useSafeAreaInsets();
    const colors = useThemeColors();
    const { profile } = useUser();
    const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingAccount, setEditingAccount] = useState<AccountWithBalance | null>(null);
    const [deletingAccount, setDeletingAccount] = useState<AccountWithBalance | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [type, setType] = useState<'checking' | 'savings' | 'credit' | 'cash' | 'other'>('checking');
    const [balance, setBalance] = useState('0');
    const [selectedColor, setSelectedColor] = useState(ACCOUNT_COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState<typeof ACCOUNT_ICONS[number]>('wallet');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchAccounts = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAccountsWithBalance();
            setAccounts(data);
        } catch (error) {
            logger.error('Error fetching accounts:', error);
            toast.error('Failed to load payment methods');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Defer DB fetch until the slide-in animation finishes so the screen
        // doesn't re-render mid-animation (spinner → content flash).
        const task = InteractionManager.runAfterInteractions(() => {
            fetchAccounts();
        });
        return () => task.cancel();
    }, [fetchAccounts]);

    const openAddModal = () => {
        setEditingAccount(null);
        setName('');
        setType('checking');
        setBalance('0');
        setSelectedColor(ACCOUNT_COLORS[0]);
        setSelectedIcon('wallet');
        setModalVisible(true);
    };

    const openEditModal = (account: AccountWithBalance) => {
        setEditingAccount(account);
        setName(account.name);
        setType(account.type);
        // Edit the stored opening balance; `balance` includes all transactions.
        setBalance(account.initial_balance.toString());
        setSelectedColor(account.color || ACCOUNT_COLORS[0]);
        setSelectedIcon((account.icon as typeof ACCOUNT_ICONS[number]) || 'wallet');
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Please enter a name');
            return;
        }

        const numBalance = parseAmount(balance) || 0;

        setIsSubmitting(true);
        try {
            if (editingAccount) {
                await updateAccount(editingAccount.id, {
                    name: name.trim(),
                    type,
                    balance: numBalance,
                    color: selectedColor,
                    icon: selectedIcon,
                });
                toast.success('Payment method updated');
            } else {
                await createAccount({
                    name: name.trim(),
                    type,
                    balance: numBalance,
                    currency: profile.currency || 'USD',
                    color: selectedColor,
                    icon: selectedIcon,
                });
                toast.success('Payment method added');
            }
            setModalVisible(false);
            fetchAccounts();
        } catch (error: any) {
            logger.error('Error saving account:', error);
            toast.error(error.message || 'Failed to save payment method');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (account: AccountWithBalance) => {
        setDeletingAccount(account);
    };

    const handleConfirmDelete = async () => {
        if (!deletingAccount) return;
        setIsDeleting(true);
        try {
            await deleteAccount(deletingAccount.id);
            toast.success('Payment method deleted');
            setDeletingAccount(null);
            fetchAccounts();
        } catch (error: any) {
            logger.error('Error deleting account:', error);
            toast.error(error.message || 'Cannot delete payment method with transactions');
        } finally {
            setIsDeleting(false);
        }
    };

    const renderModal = () => (
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
                            {editingAccount ? 'Edit Payment Method' : 'Add Payment Method'}
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
                        {/* Name Input */}
                        <View className="mb-6">
                            <ThemedText type="kicker" className="mb-2">
                                Name
                            </ThemedText>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g., Chase Bank, Cash Wallet"
                                placeholderTextColor={colors.textMuted}
                                className="w-full rounded-xl px-6 py-4 text-textPrimary dark:text-dark-textPrimary text-base font-semibold"
                                style={{ backgroundColor: colors.backgroundAlt, fontFamily: 'PlusJakartaSans_600SemiBold' }}
                            />
                        </View>

                        {/* Type Selection */}
                        <View className="mb-6">
                            <ThemedText type="kicker" className="mb-3">
                                Type
                            </ThemedText>
                            <View className="flex-row flex-wrap gap-3">
                                {ACCOUNT_TYPES.map((accountType) => (
                                    <Pressable
                                        key={accountType.value}
                                        onPress={() => setType(accountType.value)}
                                        className="px-5 py-3 rounded-xl flex-row items-center gap-2"
                                        style={{ backgroundColor: type === accountType.value ? colors.primary : colors.backgroundAlt }}
                                    >
                                        <Ionicons
                                            name={accountType.icon}
                                            size={18}
                                            color={type === accountType.value ? colors.white : colors.textMuted}
                                        />
                                        <ThemedText
                                            className="text-sm font-bold"
                                            style={{ color: type === accountType.value ? colors.white : colors.textPrimary }}
                                        >
                                            {accountType.label}
                                        </ThemedText>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Balance Input */}
                        <View className="mb-6">
                            <ThemedText type="kicker" className="mb-2">
                                Initial Balance
                            </ThemedText>
                            <TextInput
                                value={balance}
                                onChangeText={setBalance}
                                placeholder="0.00"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="decimal-pad"
                                className="w-full rounded-xl px-6 py-4 text-textPrimary dark:text-dark-textPrimary text-base font-semibold"
                                style={{ backgroundColor: colors.backgroundAlt, fontFamily: 'SpaceGrotesk_600SemiBold' }}
                            />
                        </View>

                        {/* Icon Selection */}
                        <View className="mb-6">
                            <ThemedText type="kicker" className="mb-3">
                                Icon
                            </ThemedText>
                            <View className="flex-row flex-wrap gap-3">
                                {ACCOUNT_ICONS.map((icon) => (
                                    <Pressable
                                        key={icon}
                                        onPress={() => setSelectedIcon(icon)}
                                        className="w-14 h-14 rounded-xl items-center justify-center"
                                        style={{ backgroundColor: selectedIcon === icon ? colors.primary : colors.backgroundAlt }}
                                    >
                                        <Ionicons
                                            name={icon as IoniconsName}
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
                                {ACCOUNT_COLORS.map((color) => (
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
                            label={`${editingAccount ? 'Update' : 'Add'} Payment Method`}
                            onPress={handleSave}
                            loading={isSubmitting}
                            disabled={isSubmitting}
                        />
                    </ScrollView>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );

    return (
        <View className="flex-1 bg-background dark:bg-dark-background">
            <ScrollView
                className="flex-1"
                style={{ paddingTop: insets.top }}
                contentContainerStyle={{ paddingBottom: 100 }}
                contentInsetAdjustmentBehavior="automatic"
            >
                <ScreenHeader
                    title="Accounts & Wallets"
                    right={
                        <Pressable
                            onPress={openAddModal}
                            className="w-11 h-11 rounded-xl bg-primary items-center justify-center"
                        >
                            <Ionicons name="add" size={26} color={colors.white} />
                        </Pressable>
                    }
                />

                {/* Payment Methods List */}
                <View className="px-5">
                    {loading ? (
                        <View className="py-20 items-center">
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : accounts.length === 0 ? (
                        <EmptyState
                            icon="wallet-outline"
                            title="No Accounts Yet"
                            subtitle="Add your first account or wallet to start tracking your finances."
                            actionLabel="Add Account"
                            onAction={openAddModal}
                        />
                    ) : (
                        <View className="gap-4">
                            {accounts.map((account, index) => (
                                <Animated.View
                                    key={account.id}
                                    entering={FadeInDown.delay(index * 100).springify()}
                                    className="bg-surface dark:bg-dark-surface border border-divider dark:border-dark-divider rounded-xl p-4"
                                >
                                    <View className="flex-row items-center">
                                        <View className="w-12 h-12 items-center justify-center mr-4">
                                            <Ionicons
                                                name={(account.icon as IoniconsName) || 'wallet'}
                                                size={28}
                                                color={account.color || colors.primary}
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <ThemedText className="text-lg font-bold mb-1">
                                                {account.name}
                                            </ThemedText>
                                            <ThemedText className="text-sm text-textMuted capitalize mb-1">
                                                {account.type}
                                            </ThemedText>
                                            <ThemedText className="text-base font-semibold text-primary" style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }}>
                                                {UserService.formatCurrency(account.balance, profile.currency)}
                                            </ThemedText>
                                        </View>
                                        <View className="flex-row gap-2">
                                            <Pressable
                                                onPress={() => openEditModal(account)}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Edit ${account.name}`}
                                                className="w-10 h-10 rounded-xl items-center justify-center"
                                                style={{ borderWidth: 1, borderColor: colors.borderStrong }}
                                            >
                                                <Ionicons name="create-outline" size={20} color={colors.primary} />
                                            </Pressable>
                                            <Pressable
                                                onPress={() => handleDelete(account)}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Delete ${account.name}`}
                                                className="w-10 h-10 rounded-xl items-center justify-center"
                                                style={{ borderWidth: 1, borderColor: colors.borderStrong }}
                                            >
                                                <Ionicons name="trash-outline" size={20} color={colors.expense} />
                                            </Pressable>
                                        </View>
                                    </View>
                                </Animated.View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {renderModal()}
            {deletingAccount && (
                <DeleteConfirmSheet
                    account={deletingAccount}
                    onCancel={() => setDeletingAccount(null)}
                    onConfirm={handleConfirmDelete}
                    isDeleting={isDeleting}
                />
            )}
        </View>
    );
}
