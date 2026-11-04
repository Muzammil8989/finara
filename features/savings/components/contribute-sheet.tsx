import { AmountInput, AppButton, BottomSheet, BottomSheetRef, SegmentedControl, SheetHeader, ThemedText, toLocalDateStr } from '@/components/common';
import { Pressable } from '@/components/common/pressable';
import { useAccounts } from '@/features/accounts/hooks/use-accounts';
import { NotificationService } from '@/features/notifications/services/notification-service';
import { AccountPicker } from '@/features/transactions/components/account-picker';
import { UserService } from '@/features/user/services/user-service';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { moveSavings } from '@/lib/db/queries';
import type { SavingsGoal } from '@/lib/db/schema';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import { parseAmount } from '@/lib/utils/currency';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Direction = 'deposit' | 'withdraw';

interface ContributeSheetProps {
    goal: SavingsGoal;
    currency: string;
    onClose: () => void;
    onSuccess: () => void;
}

/**
 * Move real money into or out of a savings goal. The chosen account's balance
 * changes and the goal follows, so the same money is never counted as both
 * "available" and "saved".
 */
export function ContributeSheet({ goal, currency, onClose, onSuccess }: ContributeSheetProps) {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const { accounts } = useAccounts();
    const [direction, setDirection] = useState<Direction>('deposit');
    const [amount, setAmount] = useState('');
    const [accountId, setAccountId] = useState<number | null>(null);
    const [showPicker, setShowPicker] = useState(false);
    const [saving, setSaving] = useState(false);
    const amountInputRef = useRef<TextInput>(null);
    const sheetRef = useRef<BottomSheetRef>(null);

    useEffect(() => {
        const t = setTimeout(() => amountInputRef.current?.focus(), 400);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (accountId === null && accounts.length > 0) setAccountId(accounts[0].id);
    }, [accounts, accountId]);

    const handleClose = () => {
        amountInputRef.current?.blur();
        Keyboard.dismiss();
        sheetRef.current?.dismiss(onClose);
    };

    const deposit = direction === 'deposit';
    const remaining = Math.max(0, goal.target_amount - goal.saved_amount);
    const account = accounts.find(a => a.id === accountId);
    const canWithdraw = goal.saved_amount > 0;

    const handleSave = async () => {
        const val = parseAmount(amount);
        if (isNaN(val) || val <= 0) { toast.error('Enter a valid amount'); return; }
        if (!accountId) { toast.error('Choose an account'); return; }
        const cents = Math.round(val * 100);
        if (deposit && cents > Math.round(remaining * 100)) {
            toast.error(`Only ${UserService.formatCurrency(remaining, currency)} left to reach this goal`);
            return;
        }
        if (!deposit && cents > Math.round(goal.saved_amount * 100)) {
            toast.error(`Only ${UserService.formatCurrency(goal.saved_amount, currency)} saved in this goal`);
            return;
        }
        if (deposit && account && Math.round(val * 100) > Math.round(account.balance * 100) && account.type !== 'credit') {
            toast.error(`Not enough in ${account.name}. Available: ${UserService.formatCurrency(Math.max(0, account.balance), currency)}`);
            return;
        }

        setSaving(true);
        try {
            const result = await moveSavings({ goalId: goal.id, accountId, amount: val, date: toLocalDateStr(new Date()), direction });
            if (deposit) {
                toast.success(result.is_completed ? 'Goal reached!' : 'Saved to goal');
                const oldPct = goal.target_amount > 0 ? (goal.saved_amount / goal.target_amount) * 100 : 0;
                const newPct = goal.target_amount > 0 ? (result.saved_amount / goal.target_amount) * 100 : 0;
                for (const milestone of [50, 75, 100]) {
                    if (oldPct < milestone && newPct >= milestone) {
                        NotificationService.sendSavingsMilestone(goal.name, milestone).catch(() => {});
                        break;
                    }
                }
            } else {
                toast.success('Moved back to your account');
            }
            onSuccess();
        } catch (e) {
            logger.error('Failed to move savings', e);
            toast.error(e instanceof Error && /^Only /.test(e.message) ? e.message : 'Could not update the goal');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <BottomSheet
                ref={sheetRef}
                visible
                onClose={onClose}
                paddingHorizontal={24}
                paddingTop={16}
                paddingBottom={insets.bottom + 28}
                keyboardAvoiding
            >
                <SheetHeader kicker="Savings goal" title={goal.name} onClose={handleClose} />

                {canWithdraw && (
                    <SegmentedControl
                        options={[
                            { key: 'deposit', label: 'Add money' },
                            { key: 'withdraw', label: 'Withdraw' },
                        ]}
                        value={direction}
                        onChange={d => { setDirection(d); setAmount(''); }}
                        className="mb-1"
                    />
                )}

                <AmountInput ref={amountInputRef} value={amount} onChange={setAmount} placeholder="0" fontSize={36} />

                <ThemedText type="caption" className="text-center -mt-2 mb-5" style={{ fontVariant: ['tabular-nums'] }}>
                    {deposit
                        ? `${UserService.formatCurrency(remaining, currency)} left to reach ${UserService.formatCurrency(goal.target_amount, currency)}`
                        : `${UserService.formatCurrency(goal.saved_amount, currency)} saved in this goal`}
                </ThemedText>

                <ThemedText type="kicker" className="mb-2">{deposit ? 'From account' : 'Into account'}</ThemedText>
                <Pressable
                    onPress={() => setShowPicker(true)}
                    accessibilityRole="button"
                    accessibilityLabel={`${deposit ? 'From' : 'Into'} account: ${account?.name ?? 'none selected'}`}
                    className="h-12 rounded-xl px-3.5 flex-row items-center border mb-6"
                    style={({ pressed }) => ({ backgroundColor: pressed ? colors.backgroundAlt : colors.surface, borderColor: colors.borderStrong })}
                >
                    <Ionicons name={(account?.icon as IoniconsName) || 'wallet-outline'} size={16} color={account?.color || colors.textSecondary} style={{ marginRight: 8 }} />
                    <ThemedText type="label" className="flex-1 text-[14px]" numberOfLines={1}>{account?.name ?? 'Choose'}</ThemedText>
                    {!!account && (
                        <ThemedText type="caption" className="mr-2" style={{ fontVariant: ['tabular-nums'] }}>
                            {UserService.formatCurrency(account.balance, currency)}
                        </ThemedText>
                    )}
                    <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </Pressable>

                <AppButton
                    label={deposit ? 'Save to goal' : 'Withdraw'}
                    onPress={handleSave}
                    loading={saving}
                    disabled={saving}
                />
                <View className="h-1" />
            </BottomSheet>

            <AccountPicker
                visible={showPicker}
                accounts={accounts}
                selectedAccountId={accountId}
                onSelect={(id) => { setAccountId(id); setShowPicker(false); }}
                onClose={() => setShowPicker(false)}
            />
        </>
    );
}
