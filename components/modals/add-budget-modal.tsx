import { ThemedText } from '@/components/common';
import { CategoryChips } from '@/components/transaction-form';
import { useUser } from '@/context/user-context';
import { BudgetWithSpend } from '@/hooks/use-budgets';
import { useCategories } from '@/hooks/use-categories';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { formatWithCommas, numberToWords } from '@/lib/format-amount';
import { createBudget, updateBudget } from '@/lib/db/queries';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import { POPULAR_CURRENCIES } from '@/services/user-service';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    TextInput,
    View,
} from 'react-native';
import Animated, { Easing, FadeInUp, FadeOutDown } from 'react-native-reanimated';

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
    const { categories, refresh: refreshCategories } = useCategories('expense');

    const [amount, setAmount] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [period, setPeriod] = useState<Period>('monthly');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const amountInputRef = useRef<TextInput>(null);

    const isEditing = !!editBudget;
    const currencySymbol = POPULAR_CURRENCIES.find(c => c.code === profile.currency)?.symbol || '$';

    React.useEffect(() => {
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

    React.useEffect(() => {
        if (!visible || isEditing) return;
        const t = setTimeout(() => amountInputRef.current?.focus(), 400);
        return () => clearTimeout(t);
    }, [visible, isEditing]);

    if (!visible) return null;

    const handleClose = () => {
        amountInputRef.current?.blur();
        Keyboard.dismiss();
        setAmount('');
        setSelectedCategoryId(null);
        setPeriod('monthly');
        setTimeout(() => onClose(), 250);
    };

    const handleSubmit = async () => {
        const parsedAmount = parseFloat(amount);
        if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.error('Please enter a valid budget amount');
            return;
        }
        if (!selectedCategoryId) {
            toast.error('Please select a category');
            return;
        }

        setIsSubmitting(true);
        try {
            if (isEditing && editBudget) {
                await updateBudget(editBudget.id, {
                    category_id: selectedCategoryId,
                    amount: parsedAmount,
                    period,
                });
                toast.success('Budget updated');
            } else {
                await createBudget({
                    category_id: selectedCategoryId,
                    amount: parsedAmount,
                    period,
                    is_active: 1,
                    alert_threshold: 80,
                });
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
        <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
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
                        maxHeight: '90%',
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
                        <ThemedText className="text-xl font-black">
                            {isEditing ? 'Edit Budget' : 'Add Budget'}
                        </ThemedText>
                        <Pressable onPress={handleClose} className="p-2">
                            <Ionicons name="close" size={24} color={colors.error} />
                        </Pressable>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingBottom: 24 }}
                    >
                        {/* Amount Input */}
                        <View className="py-6 mb-8">
                            <View className="flex-row items-baseline justify-center gap-1">
                                <ThemedText
                                    className="text-2xl font-bold"
                                    style={{ color: `${colors.primary}99` }}
                                >
                                    {currencySymbol}
                                </ThemedText>
                                <TextInput
                                    value={amount}
                                    onChangeText={setAmount}
                                    placeholder="0.00"
                                    placeholderTextColor={`${colors.primary}33`}
                                    ref={amountInputRef}
                                    keyboardType="decimal-pad"
                                    className="text-5xl font-black bg-transparent text-center flex-1"
                                    style={{ color: colors.primary }}
                                />
                            </View>
                            {!!amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                                <View className="items-center mt-3 gap-1">
                                    <ThemedText className="text-base font-bold" style={{ color: colors.primary }}>
                                        {formatWithCommas(amount)}
                                    </ThemedText>
                                    <ThemedText className="text-xs font-medium" style={{ color: colors.textMuted }}>
                                        {numberToWords(parseFloat(amount))}
                                    </ThemedText>
                                </View>
                            )}
                        </View>

                        {/* Category */}
                        <View className="mb-8">
                            <ThemedText
                                className="text-[10px] font-black uppercase tracking-widest mb-4"
                                style={{ color: colors.textMuted }}
                            >
                                Category
                            </ThemedText>
                            <CategoryChips
                                categories={categories}
                                selectedCategoryId={selectedCategoryId}
                                onSelect={setSelectedCategoryId}
                            />
                        </View>

                        {/* Period */}
                        <View className="mb-10">
                            <ThemedText
                                className="text-[10px] font-black uppercase tracking-widest mb-3"
                                style={{ color: colors.textMuted }}
                            >
                                Resets Every
                            </ThemedText>
                            <View className="flex-row gap-2">
                                {PERIODS.map(p => (
                                    <Pressable
                                        key={p}
                                        onPress={() => setPeriod(p)}
                                        className="flex-1 py-3 rounded-xl items-center"
                                        style={{
                                            backgroundColor: period === p
                                                ? colors.primary
                                                : colors.scheme === 'dark' ? colors.gray800 : colors.gray100,
                                        }}
                                    >
                                        <ThemedText
                                            className="text-xs font-black"
                                            style={{ color: period === p ? '#fff' : colors.textSecondary }}
                                        >
                                            {p.charAt(0).toUpperCase() + p.slice(1)}
                                        </ThemedText>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Submit */}
                        <Pressable
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full py-4 rounded-2xl items-center bg-primary shadow-lg shadow-primary/20"
                        >
                            {isSubmitting
                                ? <ActivityIndicator color="#fff" />
                                : <ThemedText className="font-black text-base text-white">
                                    {isEditing ? 'Update Budget' : 'Save Budget'}
                                </ThemedText>
                            }
                        </Pressable>
                    </ScrollView>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
