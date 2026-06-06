import { AppButton, EmptyState, ScreenHeader, ThemedText } from '@/components/common';
import { useUser } from '@/features/user/context/user-context';
import { UserService } from '@/features/user/services/user-service';
import {
    Account,
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

const ACCOUNT_COLORS = [
    '#246BFD', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

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
    account: Account;
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
                        colors={[`${colors.error}1F`, `${colors.error}0A`, 'transparent']}
                        className="absolute top-0 left-0 right-0 h-40"
                    />
                    <View className="w-12 h-1.5 bg-borderStrong dark:bg-dark-borderStrong rounded-full mx-auto mb-8" />
                    <View className="w-16 h-16 rounded-3xl items-center justify-center mx-auto mb-5"
                        style={{ backgroundColor: `${colors.error}18` }}>
                        <Ionicons name="trash-outline" size={30} color={colors.error} />
                    </View>
                    <ThemedText className="text-xl font-bold text-center mb-2">
                        Delete Account
                    </ThemedText>
                    <ThemedText className="text-sm text-center text-textMuted dark:text-dark-textMuted leading-6 mb-8 px-4">
                        Delete{' '}
                        <ThemedText className="font-bold text-textPrimary dark:text-dark-textPrimary">
                            {account.name}
                        </ThemedText>
                        ? This cannot be undone if there are associated transactions.
                    </ThemedText>
                    <View className="flex-row gap-3">
                        <Pressable
                            onPress={onCancel}
                            className="flex-1 py-4 rounded-2xl items-center border border-borderSoft dark:border-dark-borderSoft"
                            style={{ backgroundColor: colors.backgroundAlt }}
                        >
                            <ThemedText className="font-semibold text-sm">Cancel</ThemedText>
                        </Pressable>
                        <Pressable
                            onPress={onConfirm}
                            disabled={isDeleting}
                            className="flex-1 py-4 rounded-2xl items-center"
                            style={{ backgroundColor: colors.error, elevation: 6 }}
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
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
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

    const openEditModal = (account: Account) => {
        setEditingAccount(account);
        setName(account.name);
        setType(account.type);
        setBalance(account.balance.toString());
        setSelectedColor(account.color || ACCOUNT_COLORS[0]);
        setSelectedIcon((account.icon as typeof ACCOUNT_ICONS[number]) || 'wallet');
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Please enter a name');
            return;
        }

        const numBalance = parseFloat(balance) || 0;

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

    const handleDelete = (account: Account) => {
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
                    className="bg-surface dark:bg-dark-surface rounded-t-[40px] px-8 pt-10 max-h-[90%]"
                    style={{ paddingBottom: insets.bottom + 40 }}
                >
                    <LinearGradient
                        colors={[`${colors.primary}1A`, `${colors.primary}0D`, 'transparent']}
                        className="absolute top-0 left-0 right-0 h-[30%]"
                    />
                    <View className="w-12 h-1.5 bg-borderStrong dark:bg-dark-borderStrong rounded-full mx-auto mb-8" />
                    <View className="flex-row justify-between items-center mb-8">
                        <ThemedText type="title" className="text-2xl font-bold">
                            {editingAccount ? 'Edit Payment Method' : 'Add Payment Method'}
                        </ThemedText>
                        <Pressable onPress={() => setModalVisible(false)} className="p-2">
                            <Ionicons name="close" size={24} color={colors.error} />
                        </Pressable>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingBottom: 24 }}
                    >
                        {/* Name Input */}
                        <View className="mb-6">
                            <ThemedText className="text-[10px] font-bold text-textMuted mb-2 uppercase">
                                Name
                            </ThemedText>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g., Chase Bank, Cash Wallet"
                                placeholderTextColor={colors.textMuted}
                                className="w-full rounded-2xl px-6 py-4 text-textPrimary dark:text-dark-textPrimary text-base font-semibold"
                                style={{ backgroundColor: colors.backgroundAlt, fontFamily: 'PlusJakartaSans_600SemiBold' }}
                            />
                        </View>

                        {/* Type Selection */}
                        <View className="mb-6">
                            <ThemedText className="text-[10px] font-bold text-textMuted mb-3 uppercase">
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
                            <ThemedText className="text-[10px] font-bold text-textMuted mb-2 uppercase">
                                Initial Balance
                            </ThemedText>
                            <TextInput
                                value={balance}
                                onChangeText={setBalance}
                                placeholder="0.00"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="decimal-pad"
                                className="w-full rounded-2xl px-6 py-4 text-textPrimary dark:text-dark-textPrimary text-base font-semibold"
                                style={{ backgroundColor: colors.backgroundAlt, fontFamily: 'SpaceGrotesk_600SemiBold' }}
                            />
                        </View>

                        {/* Icon Selection */}
                        <View className="mb-6">
                            <ThemedText className="text-[10px] font-bold text-textMuted mb-3 uppercase">
                                Icon
                            </ThemedText>
                            <View className="flex-row flex-wrap gap-3">
                                {ACCOUNT_ICONS.map((icon) => (
                                    <Pressable
                                        key={icon}
                                        onPress={() => setSelectedIcon(icon)}
                                        className="w-14 h-14 rounded-2xl items-center justify-center"
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
                            <ThemedText className="text-[10px] font-bold text-textMuted mb-3 uppercase">
                                Color
                            </ThemedText>
                            <View className="flex-row flex-wrap gap-3">
                                {ACCOUNT_COLORS.map((color) => (
                                    <Pressable
                                        key={color}
                                        onPress={() => setSelectedColor(color)}
                                        className="w-14 h-14 rounded-2xl items-center justify-center"
                                        style={{
                                            backgroundColor: color,
                                            borderWidth: selectedColor === color ? 3 : 0,
                                            borderColor: colors.white,
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
                    title="Accounts & Wallets"
                    right={
                        <Pressable
                            onPress={openAddModal}
                            className="w-11 h-11 rounded-2xl bg-primary items-center justify-center"
                        >
                            <Ionicons name="add" size={26} color={colors.white} />
                        </Pressable>
                    }
                />

                {/* Payment Methods List */}
                <View className="px-6">
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
                                    className="bg-backgroundAlt dark:bg-dark-backgroundAlt rounded-3xl p-5"
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
                                                className="w-10 h-10 rounded-xl items-center justify-center"
                                                style={{ backgroundColor: `${colors.primary}15` }}
                                            >
                                                <Ionicons name="create-outline" size={20} color={colors.primary} />
                                            </Pressable>
                                            <Pressable
                                                onPress={() => handleDelete(account)}
                                                className="w-10 h-10 rounded-xl items-center justify-center"
                                                style={{ backgroundColor: `${colors.error}15` }}
                                            >
                                                <Ionicons name="trash-outline" size={20} color={colors.error} />
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
