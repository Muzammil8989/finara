import { AmountInput, AppButton, BottomSheet, BottomSheetRef, ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { updateSavingsGoal } from '@/lib/db/queries';
import type { SavingsGoal } from '@/lib/db/schema';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import { NotificationService } from '@/features/notifications/services/notification-service';
import { UserService } from '@/features/user/services/user-service';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ContributeSheetProps {
    goal: SavingsGoal;
    currency: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function ContributeSheet({ goal, currency, onClose, onSuccess }: ContributeSheetProps) {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const [amount, setAmount] = useState('');
    const [saving, setSaving] = useState(false);
    const amountInputRef = useRef<TextInput>(null);
    const sheetRef = useRef<BottomSheetRef>(null);

    useEffect(() => {
        const t = setTimeout(() => amountInputRef.current?.focus(), 400);
        return () => clearTimeout(t);
    }, []);

    const handleClose = () => {
        amountInputRef.current?.blur();
        Keyboard.dismiss();
        sheetRef.current?.dismiss(onClose);
    };

    const color = goal.color ?? colors.primary;
    const remaining = goal.target_amount - goal.saved_amount;

    const handleAdd = async () => {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) { toast.error('Enter a valid amount'); return; }
        setSaving(true);
        try {
            const newSaved = Math.min(goal.saved_amount + val, goal.target_amount);
            const isCompleted = newSaved >= goal.target_amount ? 1 : 0;
            await updateSavingsGoal(goal.id, { saved_amount: newSaved, is_completed: isCompleted });
            toast.success(isCompleted ? 'Goal reached!' : 'Savings added!');

            const oldPct = goal.target_amount > 0 ? (goal.saved_amount / goal.target_amount) * 100 : 0;
            const newPct = goal.target_amount > 0 ? (newSaved / goal.target_amount) * 100 : 0;
            for (const milestone of [50, 75, 100]) {
                if (oldPct < milestone && newPct >= milestone) {
                    NotificationService.sendSavingsMilestone(goal.name, milestone).catch(() => {});
                    break;
                }
            }
            onSuccess();
        } catch (e) {
            logger.error('Failed to contribute to goal', e);
            toast.error('Failed to add savings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <BottomSheet
            ref={sheetRef}
            visible
            onClose={onClose}
            paddingHorizontal={28}
            paddingTop={36}
            paddingBottom={insets.bottom + 32}
            gradientColors={[`${color}16`, `${color}06`, 'transparent']}
            keyboardAvoiding
        >
                {/* Goal info */}
                <View className="items-center mb-6">
                    <View
                        className="mb-3"
                        style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: `${color}20`, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Ionicons name={(goal.icon as IoniconsName) ?? 'wallet-outline'} size={26} color={color} />
                    </View>
                    <ThemedText className="text-lg font-bold text-textPrimary dark:text-dark-textPrimary">{goal.name}</ThemedText>
                    <ThemedText className="text-sm text-textMuted dark:text-dark-textMuted" style={{ fontFamily: 'SpaceGrotesk_600SemiBold' }}>
                        {UserService.formatCurrency(remaining, currency)} remaining
                    </ThemedText>
                </View>

                <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-2">
                    Amount to Add
                </ThemedText>

                <AmountInput
                    ref={amountInputRef}
                    value={amount}
                    onChange={setAmount}
                    color={color}
                    placeholder="0"
                    fontSize={28}
                />

                <AppButton
                    label="Add to Goal"
                    onPress={handleAdd}
                    loading={saving}
                    disabled={saving}
                    color={color}
                />
            </BottomSheet>
    );
}
