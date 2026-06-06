import { AppButton, BottomSheet, BottomSheetRef, CalendarPicker, SheetHeader, ThemedText, toLocalDateStr } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { createSavingsGoal, updateSavingsGoal } from '@/lib/db/queries';
import type { SavingsGoal } from '@/lib/db/schema';
import { formatWithCommas, numberToWords } from '@/lib/utils/currency';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import { IoniconsName } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GOAL_COLORS, GOAL_ICONS, defaultDeadline, formatDeadlineDisplay } from './utils';

interface GoalFormSheetProps {
    goal: SavingsGoal | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function GoalFormSheet({ goal, onClose, onSuccess }: GoalFormSheetProps) {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const sheetRef = useRef<BottomSheetRef>(null);

    const [name, setName] = useState(goal?.name ?? '');
    const [target, setTarget] = useState(goal ? String(goal.target_amount) : '');
    const [alreadySaved, setAlreadySaved] = useState('');
    const [selectedColor, setSelectedColor] = useState(goal?.color ?? GOAL_COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState(goal?.icon ?? GOAL_ICONS[0]);
    const [deadline, setDeadline] = useState<string>(goal?.deadline ?? defaultDeadline());
    const [showCalendar, setShowCalendar] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Open animation handled by BottomSheet on mount
    }, []);

    const handleClose = () => {
        Keyboard.dismiss();
        sheetRef.current?.dismiss(onClose);
    };

    const todayStr = toLocalDateStr(new Date());
    const wordDisplay = !!target && !isNaN(parseFloat(target)) && parseFloat(target) > 0;

    const handleSave = async () => {
        if (!name.trim()) { toast.error('Enter a goal name'); return; }
        const amount = parseFloat(target);
        if (isNaN(amount) || amount <= 0) { toast.error('Enter a valid target amount'); return; }
        if (deadline <= todayStr) { toast.error('Deadline must be in the future'); return; }
        const savedSoFar = parseFloat(alreadySaved) || 0;
        if (savedSoFar < 0) { toast.error('Already saved amount cannot be negative'); return; }
        if (!goal && savedSoFar > amount) { toast.error('Already saved cannot exceed the target'); return; }
        setSaving(true);
        try {
            const payload = { name: name.trim(), target_amount: amount, color: selectedColor, icon: selectedIcon, deadline };
            if (goal) {
                const shouldReopen = goal.saved_amount < amount;
                await updateSavingsGoal(goal.id, {
                    ...payload,
                    ...(shouldReopen ? { is_completed: 0 } : {}),
                });
                toast.success('Goal updated!');
            } else {
                const created = await createSavingsGoal({ ...payload, saved_amount: savedSoFar });
                if (savedSoFar >= amount && created?.id) {
                    await updateSavingsGoal(created.id, { is_completed: 1 });
                }
                toast.success('Goal created!');
            }
            onSuccess();
        } catch (e) {
            logger.error('Failed to save goal', e);
            toast.error('Failed to save goal');
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
                maxHeight="95%"
                paddingHorizontal={28}
                paddingTop={44}
                paddingBottom={insets.bottom + 40}
                borderTopRadius={48}
                keyboardAvoiding
            >
                <SheetHeader title={goal ? 'Edit Goal' : 'New Savings Goal'} onClose={handleClose} />

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
                    {/* Goal Name */}
                    <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-2">
                        Goal Name
                    </ThemedText>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. New Car, Vacation..."
                        placeholderTextColor={colors.textMuted}
                        className="w-full rounded-xl py-3 px-4 text-sm font-semibold mb-6 border border-borderSoft dark:border-dark-borderSoft"
                        style={{ color: colors.textPrimary, backgroundColor: colors.backgroundAlt, fontFamily: 'PlusJakartaSans_600SemiBold' }}
                    />

                    {/* Target Amount */}
                    <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-2">
                        Target Amount
                    </ThemedText>
                    <TextInput
                        value={target}
                        onChangeText={setTarget}
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="decimal-pad"
                        className="w-full rounded-xl px-4 mb-2 border border-borderSoft dark:border-dark-borderSoft"
                        style={{ color: colors.textPrimary, fontSize: 32, fontFamily: 'SpaceGrotesk_700Bold', paddingVertical: 12, backgroundColor: colors.backgroundAlt }}
                    />
                    {wordDisplay ? (
                        <View className="items-center mb-6 gap-0.5">
                            <ThemedText className="text-sm font-bold" style={{ color: colors.primary }}>{formatWithCommas(target)}</ThemedText>
                            <ThemedText className="text-[11px]" style={{ color: colors.textMuted }}>{numberToWords(parseFloat(target))}</ThemedText>
                        </View>
                    ) : (
                        <View className="mb-6" />
                    )}

                    {/* Already Saved — only on create */}
                    {!goal && (
                        <>
                            <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-2">
                                Already Saved (Optional)
                            </ThemedText>
                            <TextInput
                                value={alreadySaved}
                                onChangeText={setAlreadySaved}
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="decimal-pad"
                                className="w-full rounded-xl px-4 mb-2 border border-borderSoft dark:border-dark-borderSoft"
                                style={{ color: colors.textPrimary, fontSize: 28, fontFamily: 'SpaceGrotesk_700Bold', paddingVertical: 10, backgroundColor: colors.backgroundAlt }}
                            />
                            {!!alreadySaved && !isNaN(parseFloat(alreadySaved)) && parseFloat(alreadySaved) > 0 ? (
                                <View className="items-center mb-6 gap-0.5">
                                    <ThemedText className="text-sm font-bold" style={{ color: colors.primary }}>{formatWithCommas(alreadySaved)}</ThemedText>
                                    <ThemedText className="text-[11px]" style={{ color: colors.textMuted }}>{numberToWords(parseFloat(alreadySaved))}</ThemedText>
                                </View>
                            ) : (
                                <View className="mb-6" />
                            )}
                        </>
                    )}

                    {/* Deadline */}
                    <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-2">
                        Deadline
                    </ThemedText>
                    <Pressable
                        onPress={() => setShowCalendar(v => !v)}
                        className="h-12 rounded-xl px-4 flex-row items-center justify-between mb-8 border border-borderSoft dark:border-dark-borderSoft"
                        style={{ backgroundColor: colors.backgroundAlt }}
                    >
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                            <ThemedText className="text-sm font-semibold" style={{ color: colors.primary }}>
                                {formatDeadlineDisplay(deadline)}
                            </ThemedText>
                        </View>
                        <Ionicons name={showCalendar ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                    </Pressable>

                    {/* Color */}
                    <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-3">
                        Color
                    </ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                        <View className="flex-row gap-2 pb-1">
                            {GOAL_COLORS.map(c => (
                                <Pressable
                                    key={c}
                                    onPress={() => setSelectedColor(c)}
                                    style={{
                                        width: 36, height: 36, borderRadius: 18,
                                        backgroundColor: c,
                                        borderWidth: selectedColor === c ? 3 : 0,
                                        borderColor: colors.white,
                                        shadowColor: c,
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: selectedColor === c ? 0.5 : 0,
                                        shadowRadius: 4,
                                        elevation: selectedColor === c ? 4 : 0,
                                    }}
                                />
                            ))}
                        </View>
                    </ScrollView>

                    {/* Icon */}
                    <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted mb-3">
                        Icon
                    </ThemedText>
                    <View className="flex-row flex-wrap gap-2 mb-8">
                        {GOAL_ICONS.map(ic => (
                            <Pressable
                                key={ic}
                                onPress={() => setSelectedIcon(ic)}
                                style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: selectedIcon === ic ? `${selectedColor}25` : `${selectedColor}10`,
                                    borderWidth: selectedIcon === ic ? 2 : 1,
                                    borderColor: selectedIcon === ic ? selectedColor : `${selectedColor}30`,
                                }}
                            >
                                <Ionicons
                                    name={ic as IoniconsName}
                                    size={20}
                                    color={selectedIcon === ic ? selectedColor : `${selectedColor}80`}
                                />
                            </Pressable>
                        ))}
                    </View>

                    <AppButton
                        label={goal ? 'Save Changes' : 'Create Goal'}
                        onPress={handleSave}
                        loading={saving}
                        disabled={saving}
                    />
                </ScrollView>
            </BottomSheet>

            {showCalendar && (
                <CalendarPicker
                    selectedDate={deadline}
                    onSelectDate={d => { setDeadline(d); setShowCalendar(false); }}
                    onClose={() => setShowCalendar(false)}
                    minimumDate={defaultDeadline()}
                    quickActions={[]}
                />
            )}
        </>
    );
}
