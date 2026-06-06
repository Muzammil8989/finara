import { ThemedText } from '@/components/common';
import { useUser } from '@/context/user-context';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Transaction } from '@/hooks/use-transactions';
import { formatWithCommas, numberToWords } from '@/lib/format-amount';
import { createRecurringExpense, getActiveRecurringByCategory, updateTransaction } from '@/lib/db/queries';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import { POPULAR_CURRENCIES } from '@/services/user-service';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
import { AccountPicker, CalendarPicker, CategoryChips, toLocalDateStr } from '@/components/transaction-form';

interface EditTransactionModalProps {
    visible: boolean;
    transaction: Transaction | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditTransactionModal({ visible, transaction, onClose, onSuccess }: EditTransactionModalProps) {
    const { profile } = useUser();
    const colors = useThemeColors();
    const { categories, refresh: refreshCategories } = useCategories();
    const { accounts } = useAccounts();

    // Form state
    const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
    const [amount, setAmount] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [date, setDate] = useState(toLocalDateStr(new Date()));
    const [notes, setNotes] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [showAccountPicker, setShowAccountPicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

    const currencySymbol = POPULAR_CURRENCIES.find(c => c.code === profile.currency)?.symbol || '$';
    const isIncome = transactionType === 'income';
    const accentColor = isIncome ? '#10B981' : '#F43F5E';
    const accentColorFaded = isIncome ? '#10B98199' : '#F43F5E99';

    // Pre-fill form when transaction changes
    useEffect(() => {
        if (visible && transaction) {
            setTransactionType(transaction.type);
            setAmount(transaction.amount.toString());
            setSelectedCategoryId(transaction.category_id);
            const transactionDate = transaction.date || toLocalDateStr(new Date());
            setDate(transactionDate);
            setNotes(transaction.note || '');
            setSelectedAccountId(transaction.account_id);
            setIsRecurring(false);
            setRecurringFrequency('monthly');
            setDuplicateWarning(null);
            refreshCategories();
        }
    }, [visible, transaction]);

    // Check for duplicate recurring expense when toggle is on and category is selected
    useEffect(() => {
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

    // Filter categories by type
    const filteredCategories = (categories || []).filter(cat => cat?.type === transactionType);

    if (!visible || !transaction) return null;

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

    const handleClose = () => {
        onClose();
    };

    const handleSave = async () => {
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

        setIsSubmitting(true);
        try {
            await updateTransaction(transaction.id, {
                category_id: selectedCategoryId,
                account_id: selectedAccountId,
                amount: parsedAmount,
                type: transactionType,
                date: date,
                notes: notes.trim() || undefined,
            });

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

            toast.success(isRecurring ? 'Transaction updated & recurring created' : 'Transaction updated successfully');
            handleClose();
            onSuccess();
        } catch (error) {
            logger.error('Error updating transaction:', error);
            toast.error('Failed to update transaction');
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

    // Account picker and date picker are now handled by shared components

    return (
        <>
            <AccountPicker
                visible={showAccountPicker}
                accounts={accounts}
                selectedAccountId={selectedAccountId}
                onSelect={(id) => {
                    setSelectedAccountId(id);
                    setShowAccountPicker(false);
                }}
                onClose={() => setShowAccountPicker(false)}
            />
            <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
                <View style={{ flex: 1 }}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
                    >
                    <Animated.View
                        entering={FadeInUp.duration(350).easing(Easing.out(Easing.cubic))}
                        style={{
                            backgroundColor: colors.surface,
                            borderTopLeftRadius: 40,
                            borderTopRightRadius: 40,
                            paddingHorizontal: 32,
                            paddingTop: 40,
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
                            colors={['rgba(36, 107, 253, 0.15)', 'rgba(59, 130, 246, 0.06)', 'transparent']}
                            className="absolute top-0 left-0 right-0 h-[40%]"
                        />
                        <View className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-8" />

                        {/* Header */}
                        <View className="flex-row items-center justify-between mb-6">
                            <View className="flex-row items-center gap-3">
                                <View className="w-10 h-10 rounded-2xl items-center justify-center" style={{ backgroundColor: `${accentColor}20` }}>
                                    <Ionicons name="create-outline" size={20} color={accentColor} />
                                </View>
                                <ThemedText className="text-xl font-black">{isIncome ? 'Edit Income' : 'Edit Expense'}</ThemedText>
                            </View>
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

                            {/* Amount Input */}
                            <View className="py-6 mb-8">
                                <View className="flex-row items-baseline justify-center gap-1">
                                    <ThemedText className="text-2xl font-bold" style={{ color: accentColorFaded }}>{currencySymbol}</ThemedText>
                                    <TextInput
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
                                <CategoryChips
                                    categories={filteredCategories}
                                    selectedCategoryId={selectedCategoryId}
                                    onSelect={setSelectedCategoryId}
                                />
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
                                                    style={{ backgroundColor: `${selectedAccount.color || colors.primary}20` }}
                                                >
                                                    <Ionicons name={(selectedAccount.icon as IoniconsName) || 'wallet'} size={16} color={selectedAccount.color || colors.primary} />
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
                                <ThemedText className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: colors.textMuted }}>Note</ThemedText>
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

                            {/* Make Recurring Toggle */}
                            <View className="flex-row items-center justify-between py-4 mb-4">
                                <View className="flex-row items-center gap-3">
                                    <Ionicons name="repeat" size={20} color={isRecurring ? accentColor : colors.textMuted} />
                                    <ThemedText className="text-sm font-black">Make Recurring</ThemedText>
                                </View>
                                <Switch
                                    value={isRecurring}
                                    onValueChange={setIsRecurring}
                                    trackColor={{ false: colors.borderSoft, true: accentColor }}
                                    thumbColor="#FFFFFF"
                                />
                            </View>

                            {/* Duplicate recurring warning */}
                            {isRecurring && duplicateWarning && (
                                <View
                                    className="flex-row items-start gap-3 rounded-xl px-4 py-3 mb-4"
                                    style={{ backgroundColor: '#F59E0B20', borderWidth: 1, borderColor: '#F59E0B60' }}
                                >
                                    <Ionicons name="warning-outline" size={18} color="#F59E0B" style={{ marginTop: 1 }} />
                                    <ThemedText className="flex-1 text-xs font-bold" style={{ color: '#D97706' }}>
                                        {`"${duplicateWarning}" is already set up as a recurring ${transactionType}. Adding again may create duplicates.`}
                                    </ThemedText>
                                </View>
                            )}

                            {/* Frequency Picker (shown when recurring is on) */}
                            {isRecurring && (
                                <View className="mb-8">
                                    <ThemedText className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: colors.textMuted }}>Frequency</ThemedText>
                                    <View className="flex-row gap-2">
                                        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(freq => (
                                            <Pressable
                                                key={freq}
                                                onPress={() => setRecurringFrequency(freq)}
                                                className="flex-1 py-3 rounded-xl items-center"
                                                style={{
                                                    backgroundColor: recurringFrequency === freq ? accentColor : colors.scheme === 'dark' ? colors.gray800 : colors.gray100,
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
                                </View>
                            )}
                            {!isRecurring && <View className="mb-4" />}

                            {/* Save Button */}
                            <Pressable
                                onPress={handleSave}
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
                                {isSubmitting
                                    ? <ActivityIndicator color={colors.white} />
                                    : <ThemedText className="font-black text-base text-white">Update Transaction</ThemedText>
                                }
                            </Pressable>
                        </ScrollView>
                    </Animated.View>
                </KeyboardAvoidingView>

                {/* Date Picker - Slide up calendar */}
                {showDatePicker && (
                    <CalendarPicker
                        selectedDate={date}
                        onSelectDate={(d) => {
                            setDate(d);
                            setShowDatePicker(false);
                        }}
                        onClose={() => setShowDatePicker(false)}
                    />
                )}
            </View>
            </Modal>
        </>
    );
}
