import { AmountInput, SegmentedControl, ThemedText, type SegmentOption } from '@/components/common';
import type { Account } from '@/lib/db/schema';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { fonts } from '@/theme/typography';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef } from 'react';
import { Switch, TextInput, View } from 'react-native';
import { Pressable } from '@/components/common/pressable';
import { CategoryChips } from './category-chips';

export type TxType = 'expense' | 'income' | 'transfer';
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

const TYPE_SEGMENTS: readonly SegmentOption<TxType>[] = [
    { key: 'expense', label: 'Expense' },
    { key: 'income', label: 'Income' },
];
const TYPE_SEGMENTS_WITH_TRANSFER: readonly SegmentOption<TxType>[] = [
    ...TYPE_SEGMENTS,
    { key: 'transfer', label: 'Transfer', accessibilityLabel: 'Transfer between your accounts' },
];
const FREQ_SEGMENTS: readonly SegmentOption<Frequency>[] = (['daily', 'weekly', 'monthly', 'yearly'] as const)
    .map(f => ({ key: f, label: f.charAt(0).toUpperCase() + f.slice(1) }));

interface Category { id: number; name: string; type: string; icon?: string | null; color?: string | null }

interface TransactionFormFieldsProps {
    transactionType: TxType;
    onTypeChange: (t: TxType) => void;
    amount: string;
    onAmountChange: (v: string) => void;
    currencySymbol: string;
    categories: Category[];
    selectedCategoryId: number | null;
    onCategorySelect: (id: number) => void;
    selectedAccount: Pick<Account, 'name' | 'icon' | 'color'> | undefined;
    onAccountPress: () => void;
    displayDate: string;
    onDatePress: () => void;
    notes: string;
    onNotesChange: (v: string) => void;
    isRecurring: boolean;
    onRecurringChange: (v: boolean) => void;
    recurringFrequency: Frequency;
    onFrequencyChange: (f: Frequency) => void;
    /** Category name that already has an active recurring rule, if any. */
    duplicateWarning: string | null;
    /** Hide "Repeat automatically" (e.g. editing a transaction that already belongs to a schedule). */
    hideRepeat?: boolean;
    /** Offer the Transfer type (add only — a transfer is edited by deleting and re-adding it). */
    allowTransfer?: boolean;
    /** Transfer mode: the account the money goes to. */
    toAccount?: Pick<Account, 'name' | 'icon' | 'color'>;
    onToAccountPress?: () => void;
}

/**
 * The fields shared by Add and Edit transaction, in the order people fill
 * them: type → amount → category → account & date → note → (optional) repeat.
 */
export const TransactionFormFields = forwardRef<TextInput, TransactionFormFieldsProps>(function TransactionFormFields(p, amountRef) {
    const colors = useThemeColors();
    const isTransfer = p.transactionType === 'transfer';

    return (
        <View>
            <SegmentedControl
                options={p.allowTransfer ? TYPE_SEGMENTS_WITH_TRANSFER : TYPE_SEGMENTS}
                value={p.transactionType}
                onChange={p.onTypeChange}
                className="mb-2"
            />

            <AmountInput
                ref={amountRef}
                value={p.amount}
                onChange={p.onAmountChange}
                currencySymbol={p.currencySymbol}
                color={p.transactionType === 'income' ? colors.income : colors.textPrimary}
            />

            {isTransfer ? (
                <View className="mb-5">
                    <ThemedText type="kicker" className="mb-2">To account</ThemedText>
                    <FieldButton
                        onPress={p.onToAccountPress ?? (() => {})}
                        accessibilityLabel={`To account: ${p.toAccount?.name ?? 'none selected'}`}
                        icon={(p.toAccount?.icon as IoniconsName) || 'wallet-outline'}
                        iconColor={p.toAccount?.color || colors.textSecondary}
                        label={p.toAccount?.name || 'Choose'}
                        trailing="chevron-down"
                    />
                    <ThemedText type="caption" className="mt-2">
                        Moves money between your own accounts. It is not counted as income or spending.
                    </ThemedText>
                </View>
            ) : (
                <>
                    <ThemedText type="kicker" className="mb-3">Category</ThemedText>
                    <View className="mb-7">
                        <CategoryChips categories={p.categories} selectedCategoryId={p.selectedCategoryId} onSelect={p.onCategorySelect} />
                    </View>
                </>
            )}

            <View className="flex-row gap-3 mb-7">
                <View className="flex-1">
                    <ThemedText type="kicker" className="mb-2">{isTransfer ? 'From account' : p.transactionType === 'income' ? 'Paid into' : 'Paid from'}</ThemedText>
                    <FieldButton
                        onPress={p.onAccountPress}
                        accessibilityLabel={`Account: ${p.selectedAccount?.name ?? 'none selected'}`}
                        icon={(p.selectedAccount?.icon as IoniconsName) || 'wallet-outline'}
                        iconColor={p.selectedAccount?.color || colors.textSecondary}
                        label={p.selectedAccount?.name || 'Choose'}
                        trailing="chevron-down"
                    />
                </View>
                <View className="flex-1">
                    <ThemedText type="kicker" className="mb-2">Date</ThemedText>
                    <FieldButton
                        onPress={p.onDatePress}
                        accessibilityLabel={`Date: ${p.displayDate}`}
                        icon="calendar-outline"
                        iconColor={colors.textSecondary}
                        label={p.displayDate}
                    />
                </View>
            </View>

            <ThemedText type="kicker" className="mb-2">Note</ThemedText>
            <TextInput
                value={p.notes}
                onChangeText={p.onNotesChange}
                placeholder={p.transactionType === 'income' ? 'e.g. November salary' : 'e.g. Weekly groceries'}
                placeholderTextColor={colors.inputPlaceholder}
                accessibilityLabel="Note"
                multiline
                numberOfLines={2}
                underlineColorAndroid="transparent"
                className="w-full rounded-xl py-3 px-4 text-[15px] mb-7 border"
                style={{
                    color: colors.textPrimary,
                    backgroundColor: colors.surface,
                    borderColor: colors.borderStrong,
                    fontFamily: fonts.sans,
                    minHeight: 48,
                }}
            />

            {/* Repeat — optional, so it comes last */}
            {!isTransfer && !p.hideRepeat && (
            <View className="border-t border-b border-divider dark:border-dark-divider mb-7">
                <View className="flex-row items-center justify-between min-h-[56px]">
                    <View className="flex-row items-center flex-1 mr-3">
                        <Ionicons name="repeat" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                        <View className="flex-1">
                            <ThemedText type="defaultSemiBold" className="text-[15px]">Repeat automatically</ThemedText>
                            {!p.isRecurring && (
                                <ThemedText type="caption">Adds this {p.transactionType} on a schedule</ThemedText>
                            )}
                        </View>
                    </View>
                    <Switch
                        value={p.isRecurring}
                        onValueChange={p.onRecurringChange}
                        trackColor={{ false: colors.borderStrong, true: colors.primary }}
                        thumbColor="#FFFFFF"
                        accessibilityLabel="Repeat automatically"
                    />
                </View>

                {p.isRecurring && (
                    <View className="pb-4">
                        <SegmentedControl options={FREQ_SEGMENTS} value={p.recurringFrequency} onChange={p.onFrequencyChange} />
                        {p.duplicateWarning && (
                            <View className="flex-row items-start gap-2 rounded-lg px-3 py-2.5 mt-3 bg-warningBg dark:bg-dark-warningBg">
                                <Ionicons name="warning-outline" size={15} color={colors.warningText} style={{ marginTop: 1 }} />
                                <ThemedText className="flex-1 text-xs" style={{ color: colors.warningText }}>
                                    {`"${p.duplicateWarning}" already repeats as a ${p.transactionType}. Adding another may double-count it.`}
                                </ThemedText>
                            </View>
                        )}
                    </View>
                )}
            </View>
            )}
        </View>
    );
});

function FieldButton({
    onPress, accessibilityLabel, icon, iconColor, label, trailing,
}: {
    onPress: () => void;
    accessibilityLabel: string;
    icon: IoniconsName;
    iconColor: string;
    label: string;
    trailing?: IoniconsName;
}) {
    const colors = useThemeColors();
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            className="h-12 rounded-xl px-3.5 flex-row items-center border"
            style={({ pressed }) => ({
                backgroundColor: pressed ? colors.backgroundAlt : colors.surface,
                borderColor: colors.borderStrong,
            })}
        >
            <Ionicons name={icon} size={16} color={iconColor} style={{ marginRight: 8 }} />
            <ThemedText type="label" className="flex-1 text-[14px]" numberOfLines={1}>{label}</ThemedText>
            {trailing && <Ionicons name={trailing} size={16} color={colors.textMuted} />}
        </Pressable>
    );
}
