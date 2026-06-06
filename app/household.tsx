import { EmptyState, ScreenHeader, ThemedText } from '@/components/common';
import { IncomeCard } from '@/app/_household/income-card';
import { SummaryBar } from '@/app/_household/summary-bar';
import { ExpenseItem } from '@/app/_household/expense-item';
import { IncomeSetupModal } from '@/app/_household/income-setup-modal';
import { AddExpenseModal } from '@/app/_household/add-expense-modal';
import { TransferModal } from '@/app/_household/transfer-modal';
import { useHousehold } from '@/hooks/use-household';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useUser } from '@/features/user/context/user-context';
import { deleteHouseholdExpense, deleteLinkedTransferTransaction, HouseholdExpenseWithCategory } from '@/lib/db/queries';
import { logger } from '@/lib/logger';
import { toast } from '@/lib/toast';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    View,
} from 'react-native';
import Animated, { Easing, FadeInDown, FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function DeleteConfirmSheet({
    expense,
    onCancel,
    onConfirm,
    isDeleting,
}: {
    expense: HouseholdExpenseWithCategory;
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
                        elevation: 20,
                    }}
                >
                    <LinearGradient
                        colors={['rgba(239,68,68,0.10)', 'transparent']}
                        className="absolute top-0 left-0 right-0 h-[60%]"
                    />
                    <View className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6" />

                    <View
                        className="w-16 h-16 rounded-2xl items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: `${colors.error}15` }}
                    >
                        <Ionicons name="trash-outline" size={28} color={colors.error} />
                    </View>

                    <ThemedText className="text-xl font-semibold text-center text-textPrimary dark:text-dark-textPrimary mb-2">
                        Delete Expense?
                    </ThemedText>
                    <ThemedText className="text-sm text-center mb-8 text-textMuted dark:text-dark-textMuted">
                        "{expense.categoryName ?? 'Expense'}" will be permanently removed.
                    </ThemedText>

                    <View className="gap-3">
                        <Pressable
                            onPress={onConfirm}
                            disabled={isDeleting}
                            className="w-full py-4 rounded-2xl items-center"
                            style={{ backgroundColor: colors.error }}
                        >
                            {isDeleting
                                ? <ActivityIndicator color="#fff" />
                                : <ThemedText className="font-semibold text-base text-white">Delete</ThemedText>
                            }
                        </Pressable>
                        <Pressable
                            onPress={onCancel}
                            className="w-full py-4 rounded-2xl items-center bg-backgroundAlt dark:bg-dark-backgroundAlt"
                        >
                            <ThemedText className="font-semibold text-base text-textPrimary dark:text-dark-textPrimary">
                                Cancel
                            </ThemedText>
                        </Pressable>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

export default function HouseholdScreen() {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const { profile } = useUser();
    const currencyCode = profile.currency;

    const { config, expenses, summary, periodRange, loading, refresh } = useHousehold();

    const [incomeModalVisible, setIncomeModalVisible] = useState(false);
    const [addExpenseVisible, setAddExpenseVisible] = useState(false);
    const [editingExpense, setEditingExpense] = useState<HouseholdExpenseWithCategory | null>(null);
    const [deletingExpense, setDeletingExpense] = useState<HouseholdExpenseWithCategory | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [transferVisible, setTransferVisible] = useState(false);

    const openAddExpense = () => {
        if (config && summary.remaining <= 0) {
            toast.error('No remaining budget — transfer or adjust your income first.');
            return;
        }
        setEditingExpense(null);
        setAddExpenseVisible(true);
    };

    const openEditExpense = (item: HouseholdExpenseWithCategory) => {
        setEditingExpense(item);
        setAddExpenseVisible(true);
    };

    const confirmDelete = async () => {
        if (!deletingExpense) return;
        setIsDeleting(true);
        try {
            if (deletingExpense.notes?.startsWith('transfer-out:')) {
                await deleteLinkedTransferTransaction(deletingExpense.date, deletingExpense.amount);
            }
            await deleteHouseholdExpense(deletingExpense.id);
            toast.success('Expense deleted');
            setDeletingExpense(null);
            refresh();
        } catch (e) {
            logger.error('HouseholdScreen: delete failed', e);
            toast.error('Failed to delete expense');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <View className="flex-1 bg-background dark:bg-dark-background">
            <LinearGradient
                colors={[`${colors.primary}1A`, `${colors.primary}0D`, 'transparent']}
                className="absolute top-0 left-0 right-0 h-[30%]"
            />

            <ScrollView
                className="flex-1"
                style={{ paddingTop: insets.top }}
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                <ScreenHeader
                    title="Household Budget"
                    subtitle="Track home expenses separately"
                    right={
                        <View className="flex-row items-center gap-2">
                            <Pressable
                                onPress={() => router.push('/household-history')}
                                className="w-11 h-11 rounded-2xl items-center justify-center"
                                style={{ backgroundColor: `${colors.primary}15` }}
                                hitSlop={6}
                            >
                                <Ionicons name="time-outline" size={20} color={colors.primary} />
                            </Pressable>
                            {!config && (
                                <Pressable
                                    onPress={() => setIncomeModalVisible(true)}
                                    className="w-11 h-11 rounded-2xl bg-primary items-center justify-center"
                                >
                                    <Ionicons name="add" size={24} color="#fff" />
                                </Pressable>
                            )}
                        </View>
                    }
                />

                <View className="px-6">
                    {loading ? (
                        <View className="py-24 items-center">
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : !config ? (
                        <EmptyState
                            icon="home-outline"
                            title="Set Up Household Budget"
                            subtitle={`Track your home expenses separately.\nSet one income and log all household expenses against it.`}
                            actionLabel="Get Started"
                            onAction={() => setIncomeModalVisible(true)}
                            iconColor={colors.primary}
                        />
                    ) : (
                        /* ── Main Content ── */
                        <Animated.View entering={FadeInDown.duration(350).easing(Easing.out(Easing.cubic))}>

                            {/* Income Card */}
                            <IncomeCard
                                config={config}
                                periodRange={periodRange}
                                currencyCode={currencyCode}
                                onEdit={() => setIncomeModalVisible(true)}
                            />

                            {/* Summary Bar */}
                            <SummaryBar summary={summary} currencyCode={currencyCode} />

                            {/* Transfer Button */}
                            {summary.remaining > 0 && (
                                <Pressable
                                    onPress={() => setTransferVisible(true)}
                                    className="flex-row items-center justify-center gap-2 py-3.5 rounded-2xl mb-4"
                                    style={{
                                        backgroundColor: `${colors.success}15`,
                                        borderWidth: 1,
                                        borderColor: `${colors.success}35`,
                                    }}
                                >
                                    <Ionicons name="swap-horizontal" size={16} color={colors.success} />
                                    <ThemedText className="font-semibold text-sm" style={{ color: colors.success }}>
                                        Transfer Remaining to Account
                                    </ThemedText>
                                </Pressable>
                            )}

                            {/* Over budget banner */}
                            {summary.remaining < 0 && (
                                <View
                                    className="flex-row items-center gap-2 py-3 px-4 rounded-2xl mb-4"
                                    style={{ backgroundColor: `${colors.error}12` }}
                                >
                                    <Ionicons name="warning-outline" size={16} color={colors.error} />
                                    <ThemedText className="text-xs font-semibold flex-1" style={{ color: colors.error }}>
                                        Over budget by {Math.abs(summary.remaining).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </ThemedText>
                                </View>
                            )}

                            {/* Section label */}
                            <View className="flex-row items-center justify-between mb-3">
                                <ThemedText className="text-[10px] font-bold uppercase text-textMuted dark:text-dark-textMuted">
                                    Expenses This Period
                                </ThemedText>
                                <ThemedText className="text-xs font-medium text-textMuted dark:text-dark-textMuted">
                                    {expenses.length} {expenses.length === 1 ? 'item' : 'items'}
                                </ThemedText>
                            </View>

                            {expenses.length === 0 ? (
                                <EmptyState
                                    icon="receipt-outline"
                                    title="No Expenses Yet"
                                    subtitle="Tap + to log your first home expense."
                                    compact
                                />
                            ) : (
                                expenses.map(item => (
                                    <ExpenseItem
                                        key={item.id}
                                        item={item}
                                        currencyCode={currencyCode}
                                        onEdit={openEditExpense}
                                        onDelete={setDeletingExpense}
                                    />
                                ))
                            )}
                        </Animated.View>
                    )}
                </View>
            </ScrollView>

            {/* FAB — shown once budget is set up */}
            {config && (
                <Pressable
                    onPress={openAddExpense}
                    style={{
                        position: 'absolute',
                        bottom: insets.bottom + 24,
                        right: 24,
                        width: 56,
                        height: 56,
                        borderRadius: 18,
                        backgroundColor: summary.remaining <= 0 ? colors.textMuted : colors.error,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: summary.remaining <= 0 ? colors.textMuted : colors.error,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: summary.remaining <= 0 ? 0.15 : 0.35,
                        shadowRadius: 10,
                        elevation: 8,
                        zIndex: 100,
                        opacity: summary.remaining <= 0 ? 0.55 : 1,
                    }}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </Pressable>
            )}

            {/* Modals */}
            <IncomeSetupModal
                visible={incomeModalVisible}
                onClose={() => setIncomeModalVisible(false)}
                onSuccess={() => { setIncomeModalVisible(false); refresh(); }}
                existingConfig={config}
                currencyCode={currencyCode}
            />

            <AddExpenseModal
                visible={addExpenseVisible}
                onClose={() => { setAddExpenseVisible(false); setEditingExpense(null); }}
                onSuccess={() => { setAddExpenseVisible(false); setEditingExpense(null); refresh(); }}
                editingExpense={editingExpense}
                currencyCode={currencyCode}
            />

            <TransferModal
                visible={transferVisible}
                onClose={() => setTransferVisible(false)}
                onSuccess={() => { setTransferVisible(false); refresh(); }}
                remaining={summary.remaining}
                currencyCode={currencyCode}
            />

            {deletingExpense && (
                <DeleteConfirmSheet
                    expense={deletingExpense}
                    onCancel={() => setDeletingExpense(null)}
                    onConfirm={confirmDelete}
                    isDeleting={isDeleting}
                />
            )}
        </View>
    );
}
