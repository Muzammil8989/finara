import { AmountInput, AppButton, BottomSheet, BottomSheetRef, SheetHeader, ThemedText } from '@/components/common';
import { CategoryChips } from '@/features/transactions/components/category-chips';
import { useUser } from '@/features/user/context/user-context';
import { BudgetWithSpend } from '../hooks/use-budgets';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { createBudget, updateBudget } from '@/lib/db/queries';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import { POPULAR_CURRENCIES } from '@/features/user/services/user-service';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'] as const;
type Period = typeof PERIODS[number];

interface AddBudgetModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editBudget?: BudgetWithSpend | null;
}

export function AddBudgetModal({ visible, onClose, onSuccess, editBudget }: AddBudgetModalProps) {
    const { profile } = useUser();
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const { categories, refresh: refreshCategories } = useCategories('expense');

    const [amount, setAmount] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [period, setPeriod] = useState<Period>('monthly');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const amountInputRef = useRef<TextInput>(null);
    const sheetRef = useRef<BottomSheetRef>(null);

    const isEditing = !!editBudget;
    const currencySymbol = POPULAR_CURRENCIES.find(c => c.code === profile.currency)?.symbol || '$';

    useEffect(() => {
        if (visible) {
            refreshCategories();
            if (editBudget) {
                setAmount(String(editBudget.amount));
                setSelectedCategoryId(editBudget.category_id);
                setPeriod(editBudget.period);
            } else {
                setAmount('');
                setSelectedCategoryId(null);
                setPeriod('monthly');
            }
        }
    }, [visible, editBudget, refreshCategories]);

    useEffect(() => {
        if (visible && !isEditing) {
            const t = setTimeout(() => amountInputRef.current?.focus(), 400);
            return () => clearTimeout(t);
        }
    }, [visible, isEditing]);

    const handleClose = () => {
        amountInputRef.current?.blur();
        Keyboard.dismiss();
        setAmount('');
        setSelectedCategoryId(null);
        setPeriod('monthly');
        sheetRef.current?.dismiss(onClose);
    };

    const handleSubmit = async () => {
        const parsedAmount = parseFloat(amount);
        if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) { toast.error('Please enter a valid budget amount'); return; }
        if (!selectedCategoryId) { toast.error('Please select a category'); return; }

        setIsSubmitting(true);
        try {
            if (isEditing && editBudget) {
                await updateBudget(editBudget.id, { category_id: selectedCategoryId, amount: parsedAmount, period });
                toast.success('Budget updated');
            } else {
                await createBudget({ category_id: selectedCategoryId, amount: parsedAmount, period, is_active: 1, alert_threshold: 80 });
                toast.success('Budget created');
            }
            handleClose();
            onSuccess();
        } catch (e) {
            logger.error('Failed to save budget', e);
            toast.error('Failed to save budget');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <BottomSheet
            ref={sheetRef}
            visible={visible}
            onClose={onClose}
            maxHeight="90%"
            paddingHorizontal={32}
            paddingTop={48}
            paddingBottom={insets.bottom + 40}
            keyboardAvoiding
        >
            <SheetHeader title={isEditing ? 'Edit Budget' : 'Add Budget'} onClose={handleClose} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 24 }}
            >
                <AmountInput
                    ref={amountInputRef}
                    value={amount}
                    onChange={setAmount}
                    currencySymbol={currencySymbol}
                />

                <View className="mb-8">
                    <ThemedText className="text-[10px] font-bold uppercase mb-4" style={{ color: colors.textMuted }}>Category</ThemedText>
                    <CategoryChips categories={categories} selectedCategoryId={selectedCategoryId} onSelect={setSelectedCategoryId} />
                </View>

                <View className="mb-10">
                    <ThemedText className="text-[10px] font-bold uppercase mb-3" style={{ color: colors.textMuted }}>Resets Every</ThemedText>
                    <View className="flex-row gap-2">
                        {PERIODS.map(p => (
                            <Pressable
                                key={p}
                                onPress={() => setPeriod(p)}
                                className="flex-1 py-3 rounded-xl items-center"
                                style={{ backgroundColor: period === p ? colors.primary : colors.backgroundAlt }}
                            >
                                <ThemedText className="text-xs font-bold" style={{ color: period === p ? '#fff' : colors.textSecondary }}>
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </View>
                </View>

                <AppButton
                    label={isEditing ? 'Update Budget' : 'Save Budget'}
                    onPress={handleSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                />
            </ScrollView>
        </BottomSheet>
    );
}
