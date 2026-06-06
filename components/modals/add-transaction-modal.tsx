import { ThemedText } from '@/components/common';
import { AccountPicker, CalendarPicker, CategoryChips, toLocalDateStr } from '@/components/transaction-form';
import { useUser } from '@/context/user-context';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { createRecurringExpense, createTransaction, getCurrentBalance, getActiveRecurringByCategory } from '@/lib/db/queries';
import { formatWithCommas, numberToWords } from '@/lib/format-amount';
import { logger } from '@/lib/logger';
import { NewTransaction } from '@/lib/db/schema';
import { toast } from '@/lib/toast';
import { POPULAR_CURRENCIES, UserService } from '@/services/user-service';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Switch,
    TextInput,
    Pressable,
    View,
} from 'react-native';
import Animated, {
    Easing,
    FadeInUp,
    FadeOutDown,
} from 'react-native-reanimated';

interface AddTransactionModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialType?: 'expense' | 'income';
}

export function AddTransactionModal({ visible, onClose, onSuccess, initialType = 'expense' }: AddTransactionModalProps) {
    const { profile } = useUser();
    const colors = useThemeColors();
    const { categories, refresh: refreshCategories } = useCategories();

    // Form state
    const [transactionType, setTransactionType] = useState<'expense' | 'income'>(initialType);
    const [amount, setAmount] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [date, setDate] = useState(toLocalDateStr(new Date()));
    const [notes, setNotes] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [showAccountPicker, setShowAccountPicker] = useState(false);
    const amountInputRef = useRef<TextInput>(null);

    const { accounts } = useAccounts();

    const currencySymbol = POPULAR_CURRENCIES.find(c => c.code === profile.currency)?.symbol || '$';

    const isIncome = transactionType === 'income';
    const accentColor = isIncome ? '#10B981' : '#F43F5E';
    const accentColorFaded = isIncome ? '#10B98199' : '#F43F5E99';

    // Sync transaction type when modal opens with a specific type
    React.useEffect(() => {
        if (visible) {
            setTransactionType(initialType);
            setSelectedCategoryId(null);
        }
    }, [visible, initialType]);

    // Refresh categories when modal becomes visible
    React.useEffect(() => {
        if (visible) {
            refreshCategories();
        }
    }, [visible, refreshCategories]);

    React.useEffect(() => {
        if (!visible) return;
        const t = setTimeout(() => amountInputRef.current?.focus(), 400);
        return () => clearTimeout(t);
    }, [visible]);

    // Set default account when accounts are loaded
    React.useEffect(() => {
        if (accounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accounts[0].id);
        }
    }, [accounts, selectedAccountId]);

    // Check for duplicate recurring expense when toggle is on and category is selected
    React.useEffect(() => {
        if (!isRecurring || !selectedCategoryId) {
            setDuplicateWarning(null);
            return;
        }
        getActiveRecurringByCategory(selectedCategoryId).then(results => {
            if (results.length > 0) {
                const cat = (categories || []).find(c => c.id === selectedCategoryId);
                setDuplicateWarning(cat?.name ?? 'This category');
            } else {
                setDuplicateWarning(null);
            }
        }).catch(() => setDuplicateWarning(null));
    }, [isRecurring, selectedCategoryId, categories]);

    // Filter categories by type - ensure categories array exists
    const filteredCategories = (categories || []).filter(cat => cat?.type === transactionType);

    // Don't render anything if not visible
    if (!visible) {
        return null;
    }

    // Show loading state if data isn't ready yet
    if (!categories || categories.length === 0 || !accounts || accounts.length === 0) {
        return (
            <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
                <View className="flex-1 justify-center items-center bg-black/40">
                    <View className="bg-white dark:bg-gray-900 rounded-3xl p-8">
                        <ActivityIndicator size="large" color={colors.primary} />
                        <ThemedText className="mt-4 text-center">Loading...</ThemedText>
                    </View>
                </View>
            </Modal>
        );
    }

    // Reset form
    const resetForm = () => {
        setTransactionType(initialType);
        setAmount('');
        setSelectedCategoryId(null);
        setDate(toLocalDateStr(new Date()));
        setNotes('');
        setIsRecurring(false);
        setRecurringFrequency('monthly');
        setDuplicateWarning(null);
        setShowDatePicker(false);
        setShowAccountPicker(false);
        if (accounts.length > 0) {
            setSelectedAccountId(accounts[0].id);
        }
    };

    const handleClose = () => {
        amountInputRef.current?.blur();
        Keyboard.dismiss();
        setTimeout(() => { resetForm(); onClose(); }, 250);
    };

    const handleSubmit = async () => {
        // Validation
        const parsedAmount = parseFloat(amount);
        if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (parsedAmount > 999_999_999) {
            toast.error('Amount is too large');
            return;
        }

        if (!selectedCategoryId) {
            toast.error('Please select a category');
            return;
        }

        if (!selectedAccountId) {
            toast.error('Please select a payment method');
            return;
        }

        // Balance validation for expenses
        if (transactionType === 'expense') {
            try {
                const currentBalance = await getCurrentBalance();
                if (currentBalance <= 0) {
                    toast.error('Please add income first to build your balance');
                    return;
                }
                if (parsedAmount > currentBalance) {
                    toast.error(`Insufficient balance. Available: ${UserService.formatCurrency(currentBalance, profile.currency)}`);
                    return;
                }
            } catch (err) {
                logger.error('Error checking balance:', err);
            }
        }

        setIsSubmitting(true);

        try {
            const newTransaction: NewTransaction = {
                category_id: selectedCategoryId,
                account_id: selectedAccountId,
                amount: parsedAmount,
                type: transactionType,
                date: date,
                notes: notes.trim() || undefined,
            };

            await createTransaction(newTransaction);

            // Also create a recurring expense if toggled on
            if (isRecurring) {
                await createRecurringExpense({
                    category_id: selectedCategoryId,
                    account_id: selectedAccountId,
                    amount: parsedAmount,
                    frequency: recurringFrequency,
                    start_date: date,
                    notes: notes.trim() || undefined,
                    is_active: 1,
                });
            }

            toast.success(
                `${isIncome ? 'Income' : 'Expense'} added${isRecurring ? ' (recurring)' : ''}`
            );
            handleClose();
            onSuccess();
        } catch (error) {
            logger.error('Error creating transaction:', error);
            toast.error('Failed to create transaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedAccount = accounts.find(a => a.id === selectedAccountId);

    // Format date for display: "17 Feb 2026"
    const displayDate = (() => {
        const [y, m, d] = date.split('-');
        const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${parseInt(d)} ${shortMonths[parseInt(m) - 1]} ${y}`;
    })();

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
            <View style={{ flex: 1 }}>
                {/* Main content */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
                >
                    <Animated.View
                        entering={FadeInUp.duration(350).easing(Easing.out(Easing.cubic))}
                        style={{
                            backgroundColor: colors.surface,
                            borderTopLeftRadius: 48,
                            borderTopRightRadius: 48,
                            paddingHorizontal: 32,
                            paddingTop: 48,
                            paddingBottom: 64,
                            overflow: 'hidden',
                            maxHeight: '95%',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -4 },
                            shadowOpacity: 0.15,
                            shadowRadius: 20,
                            elevation: 24,
                        }}
                    >
                        <LinearGradient
                            colors={['rgba(36, 107, 253, 0.2)', 'rgba(59, 130, 246, 0.1)', 'transparent']}
                            className="absolute top-0 left-0 right-0 h-[40%]"
                        />
                        <View className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-8" />

                        <View className="flex-row items-center justify-between mb-6">
                            <ThemedText className="text-xl font-black">{isIncome ? 'Add Income' : 'Add Expense'}</ThemedText>
                            <Pressable onPress={handleClose} className="p-2">
                                <Ionicons name="close" size={24} color={colors.error} />
                            </Pressable>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ paddingBottom: 24 }}
                        >
                            {/* Income / Expense Toggle */}
                            <View className="flex-row p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-8">
                                <Pressable
                                    onPress={() => { setTransactionType('expense'); setSelectedCategoryId(null); setIsRecurring(false); }}
                                    className="flex-1 py-3.5 rounded-xl"
                                    style={!isIncome ? {
                                        backgroundColor: colors.surface,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.08,
                                        shadowRadius: 2,
                                        elevation: 1,
                                    } : undefined}
                                >
                                    <ThemedText
                                        className="text-sm font-black text-center"
                                        style={{ color: !isIncome ? '#F43F5E' : '#9CA3AF' }}
                                    >
                                        Expense
                                    </ThemedText>
                                </Pressable>
                                <Pressable
                                    onPress={() => { setTransactionType('income'); setSelectedCategoryId(null); setIsRecurring(false); }}
                                    className="flex-1 py-3.5 rounded-xl"
                                    style={isIncome ? {
                                        backgroundColor: colors.surface,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.08,
                                        shadowRadius: 2,
                                        elevation: 1,
                                    } : undefined}
                                >
                                    <ThemedText
                                        className="text-sm font-black text-center"
                                        style={{ color: isIncome ? '#10B981' : '#9CA3AF' }}
                                    >
                                        Income
                                    </ThemedText>
                                </Pressable>
                            </View>

                            {/* Make Recurring Toggle — visible without scrolling */}
                            <View
                                className="rounded-2xl px-4 mb-6"
                                style={{
                                    backgroundColor: isRecurring
                                        ? `${accentColor}12`
                                        : colors.scheme === 'dark' ? colors.gray800 : colors.gray100,
                                    borderWidth: 1,
                                    borderColor: isRecurring ? `${accentColor}40` : 'transparent',
                                }}
                            >
                                <View className="flex-row items-center justify-between py-3.5">
                                    <View className="flex-row items-center gap-3">
                                        <View
                                            className="w-8 h-8 rounded-xl items-center justify-center"
                                            style={{ backgroundColor: isRecurring ? `${accentColor}25` : colors.scheme === 'dark' ? colors.gray700 : colors.gray200 }}
                                        >
                                            <Ionicons name="repeat" size={16} color={isRecurring ? accentColor : colors.textMuted} />
                                        </View>
                                        <View>
                                            <ThemedText className="text-sm font-black">Make Recurring</ThemedText>
                                            {!isRecurring && (
                                                <ThemedText className="text-xs" style={{ color: colors.textMuted }}>Repeat this {transactionType} automatically</ThemedText>
                                            )}
                                        </View>
                                    </View>
                                    <Switch
                                        value={isRecurring}
                                        onValueChange={setIsRecurring}
                                        trackColor={{ false: colors.borderSoft, true: accentColor }}
                                        thumbColor="#FFFFFF"
                                    />
                                </View>

                                {/* Frequency Picker — inline when recurring is on */}
                                {isRecurring && (
                                    <View className="pb-4">
                                        <ThemedText className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: colors.textMuted }}>Frequency</ThemedText>
                                        <View className="flex-row gap-2">
                                            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(freq => (
                                                <Pressable
                                                    key={freq}
                                                    onPress={() => setRecurringFrequency(freq)}
                                                    className="flex-1 py-2.5 rounded-xl items-center"
                                                    style={{
                                                        backgroundColor: recurringFrequency === freq ? accentColor : colors.scheme === 'dark' ? colors.gray700 : colors.gray200,
                                                    }}
                                                >
                                                    <ThemedText
                                                        className="text-xs font-black"
                                                        style={{ color: recurringFrequency === freq ? colors.white : colors.textSecondary }}
                                                    >
                                                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                                                    </ThemedText>
                                                </Pressable>
                                            ))}
                                        </View>

                                        {/* Duplicate warning */}
                                        {duplicateWarning && (
                                            <View
                                                className="flex-row items-start gap-2 rounded-xl px-3 py-2.5 mt-3"
                                                style={{ backgroundColor: '#F59E0B20', borderWidth: 1, borderColor: '#F59E0B50' }}
                                            >
                                                <Ionicons name="warning-outline" size={15} color="#F59E0B" style={{ marginTop: 1 }} />
                                                <ThemedText className="flex-1 text-xs font-bold" style={{ color: '#D97706' }}>
                                                    {`"${duplicateWarning}" is already a recurring ${transactionType}. Adding again may create duplicates.`}
                                                </ThemedText>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>

                            {/* Amount Input */}
                            <View className="py-6 mb-8">
                                <View className="flex-row items-baseline justify-center gap-1">
                                    <ThemedText className="text-2xl font-bold" style={{ color: accentColorFaded }}>{currencySymbol}</ThemedText>
                                    <TextInput
                                        ref={amountInputRef}
                                        value={amount}
                                        onChangeText={setAmount}
                                        placeholder="0.00"
                                        placeholderTextColor={isIncome ? `${colors.success}33` : `${colors.error}33`}
                                        keyboardType="decimal-pad"
                                        className="text-5xl font-black bg-transparent text-center flex-1"
                                        style={{ color: accentColor }}
                                    />
                                </View>
                                {!!amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                                    <View className="items-center mt-3 gap-1">
                                        <ThemedText className="text-base font-bold" style={{ color: accentColor }}>
                                            {formatWithCommas(amount)}
                                        </ThemedText>
                                        <ThemedText className="text-xs font-medium" style={{ color: colors.textMuted }}>
                                            {numberToWords(parseFloat(amount))}
                                        </ThemedText>
                                    </View>
                                )}
                            </View>

                            {/* Category Selection */}
                            <View className="mb-8">
                                <ThemedText className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: colors.textMuted }}>Category</ThemedText>
                                <CategoryChips categories={filteredCategories} selectedCategoryId={selectedCategoryId} onSelect={setSelectedCategoryId} />
                            </View>

                            {/* Payment Method & Date */}
                            <View className="flex-row gap-4 mb-8">
                                <View className="flex-1">
                                    <ThemedText className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: colors.textMuted }}>Payment Method</ThemedText>
                                    <Pressable
                                        onPress={() => setShowAccountPicker(true)}
                                        className="h-12 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 flex-row items-center justify-between"
                                    >
                                        <View className="flex-row items-center flex-1">
                                            {selectedAccount && (
                                                <View
                                                    className="w-8 h-8 rounded-lg items-center justify-center mr-2"
                                                    style={{
                                                        backgroundColor: `${selectedAccount.color || colors.primary}20`
                                                    }}
                                                >
                                                    <Ionicons
                                                        name={(selectedAccount.icon as IoniconsName) || 'wallet'}
                                                        size={16}
                                                        color={selectedAccount.color || colors.primary}
                                                    />
                                                </View>
                                            )}
                                            <ThemedText className="text-sm font-bold" numberOfLines={1}>
                                                {selectedAccount?.name || 'Select Method'}
                                            </ThemedText>
                                        </View>
                                        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                                    </Pressable>
                                </View>
                                <View className="flex-1">
                                    <ThemedText className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: colors.textMuted }}>Date</ThemedText>
                                    <Pressable onPress={() => setShowDatePicker(true)} className="h-12 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 flex-row items-center justify-center">
                                        <Ionicons name="calendar-outline" size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
                                        <ThemedText className="text-sm font-bold">{displayDate}</ThemedText>
                                    </Pressable>
                                </View>
                            </View>

                            {/* Notes */}
                            <View className="mb-8">
                                <ThemedText className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: colors.textMuted }}>Add Note</ThemedText>
                                <TextInput
                                    value={notes}
                                    onChangeText={setNotes}
                                    placeholder={`Description of the ${transactionType}...`}
                                    placeholderTextColor={colors.textMuted}
                                    multiline
                                    numberOfLines={2}
                                    className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl py-3 px-4 text-sm font-bold"
                                    style={{ color: colors.textPrimary }}
                                />
                            </View>

                            {/* Submit Button */}
                            <Pressable
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full py-4 rounded-2xl items-center"
                                style={{
                                    backgroundColor: accentColor,
                                    shadowColor: accentColor,
                                    shadowOffset: { width: 0, height: 6 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 10,
                                    elevation: 8,
                                }}
                            >
                                {isSubmitting ? <ActivityIndicator color={colors.white} /> : <ThemedText className="font-black text-base text-white">Save Transaction</ThemedText>}
                            </Pressable>
                        </ScrollView>
                    </Animated.View>
                </KeyboardAvoidingView>

                {/* Full Calendar Date Picker */}
                {showDatePicker && <CalendarPicker selectedDate={date} onSelectDate={(d) => { setDate(d); setShowDatePicker(false); }} onClose={() => setShowDatePicker(false)} />}

                {/* Account Picker */}
                <AccountPicker visible={showAccountPicker} accounts={accounts} selectedAccountId={selectedAccountId} onSelect={(id) => { setSelectedAccountId(id); setShowAccountPicker(false); }} onClose={() => setShowAccountPicker(false)} />
            </View>
        </Modal>
    );
}
