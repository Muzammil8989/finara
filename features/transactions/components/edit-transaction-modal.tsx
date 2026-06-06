import { AmountInput, BottomSheet, BottomSheetRef, CalendarPicker, SheetHeader, ThemedText, toLocalDateStr } from '@/components/common';
import { AccountPicker } from './account-picker';
import { CategoryChips } from './category-chips';
import { useUser } from '@/features/user/context/user-context';
import { useAccounts } from '@/features/accounts/hooks/use-accounts';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Transaction } from '../hooks/use-transactions';
import { createRecurringExpense, getActiveRecurringByCategory, updateTransaction } from '@/lib/db/queries';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import { POPULAR_CURRENCIES } from '@/features/user/services/user-service';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    Modal,
    ScrollView,
    Switch,
    TextInput,
    Pressable,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface EditTransactionModalProps {
    visible: boolean;
    transaction: Transaction | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditTransactionModal({ visible, transaction, onClose, onSuccess }: EditTransactionModalProps) {
    const { profile } = useUser();
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const { categories, refresh: refreshCategories } = useCategories();
    const { accounts } = useAccounts();

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
    const sheetRef = useRef<BottomSheetRef>(null);

    const currencySymbol = POPULAR_CURRENCIES.find(c => c.code === profile.currency)?.symbol || '$';
    const isIncome = transactionType === 'income';
    const accentColor = isIncome ? colors.success : colors.error;

    useEffect(() => {
        if (visible && transaction) {
            setTransactionType(transaction.type);
            setAmount(transaction.amount.toString());
            setSelectedCategoryId(transaction.category_id);
            setDate(transaction.date || toLocalDateStr(new Date()));
            setNotes(transaction.note || '');
            setSelectedAccountId(transaction.account_id);
            setIsRecurring(false);
            setRecurringFrequency('monthly');
            setDuplicateWarning(null);
            refreshCategories();
        }
    }, [visible, transaction]);

    // Duplicate recurring check
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

    const filteredCategories = (categories || []).filter(cat => cat?.type === transactionType);

    const handleClose = () => {
        Keyboard.dismiss();
        sheetRef.current?.dismiss(onClose);
    };

    if (!transaction) return null;

    if (!categories || categories.length === 0 || !accounts || accounts.length === 0) {
        return (
            <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
                <View className="flex-1 justify-center items-center bg-black/40">
                    <View className="bg-surface dark:bg-dark-surface rounded-3xl p-8">
                        <ActivityIndicator size="large" color={colors.primary} />
                        <ThemedText className="mt-4 text-center">Loading...</ThemedText>
                    </View>
                </View>
            </Modal>
        );
    }

    const handleSave = async () => {
        const parsedAmount = parseFloat(amount);
        if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) { toast.error('Please enter a valid amount'); return; }
        if (parsedAmount > 999_999_999) { toast.error('Amount is too large'); return; }
        if (!selectedCategoryId) { toast.error('Please select a category'); return; }
        if (!selectedAccountId) { toast.error('Please select a payment method'); return; }

        setIsSubmitting(true);
        try {
            await updateTransaction(transaction.id, {
                category_id: selectedCategoryId,
                account_id: selectedAccountId,
                amount: parsedAmount,
                type: transactionType,
                date,
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
            Keyboard.dismiss();
            onClose();
            onSuccess();
        } catch (error) {
            logger.error('Error updating transaction:', error);
            toast.error('Failed to update transaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedAccount = accounts.find(a => a.id === selectedAccountId);
    const displayDate = (() => {
        const [y, m, d] = date.split('-');
        const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${parseInt(d)} ${shortMonths[parseInt(m) - 1]} ${y}`;
    })();

    return (
        <>
            <BottomSheet
                ref={sheetRef}
                visible={visible}
                onClose={onClose}
                maxHeight="95%"
                paddingHorizontal={32}
                paddingTop={40}
                paddingBottom={insets.bottom + 40}
                borderTopRadius={40}
                gradientColors={[`${colors.primary}26`, `${colors.primary}0F`, 'transparent']}
                keyboardAvoiding
            >
                <View className="flex-row items-center justify-between mb-6">
                    <View className="flex-row items-center gap-3">
                        <Ionicons name="create-outline" size={24} color={accentColor} />
                        <ThemedText className="text-xl font-bold">{isIncome ? 'Edit Income' : 'Edit Expense'}</ThemedText>
                    </View>
                    <Pressable onPress={handleClose} className="p-2">
                        <Ionicons name="close" size={24} color={colors.error} />
                    </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
                                {/* Income / Expense toggle */}
                                <View className="flex-row p-1 rounded-2xl mb-6" style={{ backgroundColor: colors.backgroundAlt }}>
                                    <Pressable
                                        onPress={() => { setTransactionType('expense'); setSelectedCategoryId(null); setIsRecurring(false); }}
                                        className="flex-1 py-3.5 rounded-xl"
                                        style={!isIncome ? { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 } : undefined}
                                    >
                                        <ThemedText className="text-sm font-bold text-center" style={{ color: !isIncome ? colors.error : colors.textMuted }}>Expense</ThemedText>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => { setTransactionType('income'); setSelectedCategoryId(null); setIsRecurring(false); }}
                                        className="flex-1 py-3.5 rounded-xl"
                                        style={isIncome ? { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 } : undefined}
                                    >
                                        <ThemedText className="text-sm font-bold text-center" style={{ color: isIncome ? colors.success : colors.textMuted }}>Income</ThemedText>
                                    </Pressable>
                                </View>

                                {/* Make Recurring card */}
                                <View
                                    className="rounded-2xl px-4 mb-6"
                                    style={{
                                        backgroundColor: isRecurring ? `${accentColor}15` : colors.backgroundAlt,
                                        borderWidth: 1,
                                        borderColor: isRecurring ? `${accentColor}50` : 'transparent',
                                    }}
                                >
                                    <View className="flex-row items-center justify-between py-3.5">
                                        <View className="flex-row items-center gap-3">
                                            <View
                                                className="w-8 h-8 rounded-xl items-center justify-center"
                                                style={{ backgroundColor: isRecurring ? `${accentColor}25` : `${colors.textMuted}20` }}
                                            >
                                                <Ionicons name="repeat" size={16} color={isRecurring ? accentColor : colors.textMuted} />
                                            </View>
                                            <View>
                                                <ThemedText className="text-sm font-bold">Make Recurring</ThemedText>
                                                {!isRecurring && (
                                                    <ThemedText className="text-xs" style={{ color: colors.textMuted }}>
                                                        Repeat this {transactionType} automatically
                                                    </ThemedText>
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

                                    {isRecurring && (
                                        <View className="pb-4">
                                            <ThemedText className="text-[10px] font-bold uppercase mb-3" style={{ color: colors.textMuted }}>Frequency</ThemedText>
                                            <View className="flex-row gap-2">
                                                {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(freq => (
                                                    <Pressable
                                                        key={freq}
                                                        onPress={() => setRecurringFrequency(freq)}
                                                        className="flex-1 py-2.5 rounded-xl items-center"
                                                        style={{
                                                            backgroundColor: recurringFrequency === freq ? accentColor : `${colors.textMuted}20`,
                                                        }}
                                                    >
                                                        <ThemedText
                                                            className="text-xs font-bold"
                                                            style={{ color: recurringFrequency === freq ? '#FFFFFF' : colors.textSecondary }}
                                                        >
                                                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                                                        </ThemedText>
                                                    </Pressable>
                                                ))}
                                            </View>

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

                                {/* Amount */}
                                <AmountInput
                                    value={amount}
                                    onChange={setAmount}
                                    currencySymbol={currencySymbol}
                                    color={accentColor}
                                />

                                {/* Category */}
                                <View className="mb-8">
                                    <ThemedText className="text-[10px] font-bold uppercase mb-4" style={{ color: colors.textMuted }}>Category</ThemedText>
                                    <CategoryChips categories={filteredCategories} selectedCategoryId={selectedCategoryId} onSelect={setSelectedCategoryId} />
                                </View>

                                {/* Payment Method & Date */}
                                <View className="flex-row gap-4 mb-8">
                                    <View className="flex-1">
                                        <ThemedText className="text-[10px] font-bold uppercase mb-2" style={{ color: colors.textMuted }}>Payment Method</ThemedText>
                                        <Pressable onPress={() => setShowAccountPicker(true)} className="h-12 rounded-xl px-4 flex-row items-center justify-between" style={{ backgroundColor: colors.backgroundAlt }}>
                                            <View className="flex-row items-center flex-1">
                                                {selectedAccount && (
                                                    <View className="w-8 h-8 rounded-lg items-center justify-center mr-2" style={{ backgroundColor: `${selectedAccount.color || colors.primary}20` }}>
                                                        <Ionicons name={(selectedAccount.icon as IoniconsName) || 'wallet'} size={16} color={selectedAccount.color || colors.primary} />
                                                    </View>
                                                )}
                                                <ThemedText className="text-sm font-bold" numberOfLines={1}>{selectedAccount?.name || 'Select Method'}</ThemedText>
                                            </View>
                                            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                                        </Pressable>
                                    </View>
                                    <View className="flex-1">
                                        <ThemedText className="text-[10px] font-bold uppercase mb-2" style={{ color: colors.textMuted }}>Date</ThemedText>
                                        <Pressable onPress={() => setShowDatePicker(true)} className="h-12 rounded-xl px-4 flex-row items-center justify-center" style={{ backgroundColor: colors.backgroundAlt }}>
                                            <Ionicons name="calendar-outline" size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
                                            <ThemedText className="text-sm font-bold">{displayDate}</ThemedText>
                                        </Pressable>
                                    </View>
                                </View>

                                {/* Notes */}
                                <View className="mb-8">
                                    <ThemedText className="text-[10px] font-bold uppercase mb-2" style={{ color: colors.textMuted }}>Note</ThemedText>
                                    <TextInput
                                        value={notes}
                                        onChangeText={setNotes}
                                        placeholder={`Description of the ${transactionType}...`}
                                        placeholderTextColor={colors.textMuted}
                                        multiline
                                        numberOfLines={2}
                                        underlineColorAndroid="transparent"
                                        className="w-full rounded-xl py-3 px-4 text-sm font-bold"
                                        style={{ color: colors.textPrimary, backgroundColor: colors.backgroundAlt, fontFamily: 'PlusJakartaSans_600SemiBold' }}
                                    />
                                </View>

                                <Pressable
                                    onPress={handleSave}
                                    disabled={isSubmitting}
                                    className="w-full py-4 rounded-2xl items-center mb-4"
                                    style={{ backgroundColor: accentColor, shadowColor: accentColor, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 }}
                                >
                                    {isSubmitting ? <ActivityIndicator color={colors.white} /> : <ThemedText className="font-bold text-base text-white">Update Transaction</ThemedText>}
                                </Pressable>
                </ScrollView>
            </BottomSheet>

            {showDatePicker && (
                <CalendarPicker selectedDate={date} onSelectDate={(d) => { setDate(d); setShowDatePicker(false); }} onClose={() => setShowDatePicker(false)} />
            )}
            <AccountPicker
                visible={showAccountPicker}
                accounts={accounts}
                selectedAccountId={selectedAccountId}
                onSelect={(id) => { setSelectedAccountId(id); setShowAccountPicker(false); }}
                onClose={() => setShowAccountPicker(false)}
            />
        </>
    );
}
