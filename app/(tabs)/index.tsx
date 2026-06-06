/**
 * OverviewScreen — main dashboard tab.
 *
 * Design token usage:
 *   screen bg      → bg-background / dark:bg-dark-background
 *   header avatar  → bg-backgroundAlt / dark:bg-dark-backgroundAlt
 *   settings btn   → bg-primary (M3 Filled Icon Button)
 *   section label  → textPrimary / dark-textPrimary  (on-surface)
 *   greeting label → textMuted / dark-textMuted      (on-surface-variant)
 *   empty icon     → colors.textMuted (theme-specific — needs hook)
 *
 * Token constants (theme-stable, no hook needed):
 *   PRIMARY_COLOR  #246BFD — theme.brand.primary
 *   WHITE_COLOR    #FFFFFF — always on-primary
 *
 * M3 State Layer (settings button):
 *   Android → android_ripple with STATE_LAYER_COLOR
 *   iOS     → absolute overlay View on pressed
 */

import { EmptyState, IconSymbol, Skeleton, ThemedText } from '@/components/common';
import { useUser } from '@/features/user/context/user-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTransactions } from '@/features/transactions/hooks/use-transactions';
import { useSavingsGoals } from '@/features/savings/hooks/use-savings-goals';
import { shadows } from '@/theme/shadows';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Image } from 'expo-image';
import React, { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BalanceCard } from './_overview/balance-card';
import { SummaryCards } from './_overview/summary-cards';
import { SavingsGoalsWidget } from './_overview/savings-goals-widget';
import { TransactionItem } from './_overview/transaction-item';

// ─── Theme-stable constants ───────────────────────────────────────────────────
const PRIMARY_COLOR = '#246BFD';  // theme.brand.primary — identical in both themes
const WHITE_COLOR = '#FFFFFF';    // always on-primary

// M3 pressed State Layer: primary at 12% opacity
const STATE_LAYER_COLOR = 'rgba(36,107,253,0.12)';

// ─── Screen ───────────────────────────────────────────────────────────────────

function OverviewSkeleton() {
    return (
        <View className="px-6">
            <Skeleton height={160} borderRadius={24} style={{ marginBottom: 16 }} />
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                <Skeleton height={80} borderRadius={16} style={{ flex: 1 }} />
                <Skeleton height={80} borderRadius={16} style={{ flex: 1 }} />
            </View>
            <Skeleton height={13} width="40%" borderRadius={7} style={{ marginBottom: 16 }} />
            {[0, 1, 2, 3, 4].map(i => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <Skeleton width={44} height={44} borderRadius={22} />
                    <View style={{ flex: 1, marginHorizontal: 12 }}>
                        <Skeleton height={13} borderRadius={6} style={{ marginBottom: 6 }} />
                        <Skeleton width="55%" height={11} borderRadius={6} />
                    </View>
                    <Skeleton width={60} height={13} borderRadius={6} />
                </View>
            ))}
        </View>
    );
}

export default function OverviewScreen() {
    const { profile } = useUser();
    const { transactions, loading: txLoading, refresh } = useTransactions();
    const { goals, loading: goalsLoading, refresh: refreshGoals } = useSavingsGoals();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();

    const loading = txLoading || goalsLoading;
    const showSkeleton = loading && transactions.length === 0;

    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await Promise.all([refresh(), refreshGoals()]);
        setIsRefreshing(false);
    }, [refresh, refreshGoals]);


    const { totalIncome, totalExpense, balance } = useMemo(() => {
        let income = 0;
        let expense = 0;
        transactions.forEach(t => {
            if (t.type === 'income') income += t.amount;
            else expense += t.amount;
        });
        return { totalIncome: income, totalExpense: expense, balance: income - expense };
    }, [transactions]);

    const recentTransactions = useMemo(() => transactions.slice(0, 10), [transactions]);

    return (
        <View className="flex-1 bg-background dark:bg-dark-background">
            {/* Subtle brand-tinted ambient gradient — non-M3 embellishment */}
            <LinearGradient
                colors={colorScheme === 'dark'
                    ? ['rgba(36,107,253,0.15)', 'rgba(36,107,253,0.05)', 'transparent']
                    : ['rgba(36,107,253,0.08)', 'rgba(36,107,253,0.03)', 'transparent']}
                className="absolute top-0 left-0 right-0 h-[40%]"
                pointerEvents="none"
            />

            <View style={{ paddingTop: insets.top, flex: 1 }}>
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={PRIMARY_COLOR}
                            colors={[PRIMARY_COLOR]}
                        />
                    }
                >
                    {/* ── Header ─────────────────────────────────────────── */}
                    <View className="px-6 pt-6 pb-6 flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                            {/*
                              Avatar — changed from Pressable to View.
                              Was: accessibilityRole="button" with no onPress — a11y bug.
                              A button must have an action. Use View until navigation exists.
                            */}
                            <View className="size-14 rounded-full bg-backgroundAlt dark:bg-dark-backgroundAlt border border-brand-primary/20 items-center justify-center overflow-hidden mr-4">
                                {profile.avatar ? (
                                    <Image
                                        source={{ uri: profile.avatar }}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="cover"
                                    />
                                ) : (
                                    /* PRIMARY_COLOR is theme-stable — no hook needed */
                                    <IconSymbol name="person.fill" color={PRIMARY_COLOR} size={28} />
                                )}
                            </View>

                            <View className="flex-1 min-w-0">
                                <ThemedText className="text-sm text-textMuted dark:text-dark-textMuted">
                                    Welcome back,
                                </ThemedText>
                                <ThemedText
                                    type="subtitle"
                                    className="text-textPrimary dark:text-dark-textPrimary"
                                    numberOfLines={1}
                                >
                                    {profile.name || 'User'}
                                </ThemedText>
                            </View>
                        </View>

                        {/*
                          M3 Filled Icon Button
                          Shape.Large (16dp) → rounded-2xl ✓
                          bg-primary = M3 primary role ✓
                          shadow: shadows.md token (was inline colored shadow — non-token)
                          State Layer: primary at 12% on iOS + android_ripple
                        */}
                        <Link href="/settings" asChild>
                            <Pressable
                                className="size-10 rounded-2xl bg-primary items-center justify-center overflow-hidden"
                                style={shadows.md}
                                accessibilityLabel="Open settings"
                                accessibilityRole="button"
                                android_ripple={{ color: STATE_LAYER_COLOR, borderless: false }}
                            >
                                {({ pressed }: { pressed: boolean }) => (
                                    <>
                                        {pressed && Platform.OS === 'ios' && (
                                            // overflow-hidden on Pressable already clips to rounded-2xl shape;
                                            // borderRadius on the overlay itself is redundant.
                                            <View
                                                style={[StyleSheet.absoluteFillObject, styles.pressedOverlay]}
                                                pointerEvents="none"
                                            />
                                        )}
                                        {/* WHITE_COLOR is always on-primary — no hook needed */}
                                        <IconSymbol name="gearshape.fill" color={WHITE_COLOR} size={20} />
                                    </>
                                )}
                            </Pressable>
                        </Link>
                    </View>

                    {showSkeleton ? (
                        <OverviewSkeleton />
                    ) : (
                        <>
                            {/* ── Balance hero ────────────────────────────────────── */}
                            <BalanceCard balance={balance} currency={profile.currency} />

                            {/* ── Income / Expense summary ─────────────────────────── */}
                            <SummaryCards
                                totalIncome={totalIncome}
                                totalExpense={totalExpense}
                                currency={profile.currency}
                            />

                            {/* ── Savings goals ────────────────────────────────────── */}
                            <SavingsGoalsWidget goals={goals} currency={profile.currency} />

                            {/* ── Recent Activity ──────────────────────────────────── */}
                            {/*
                              M3 List section header with trailing overflow action.
                              "See all" is an M3 Text Button (no container, primary color)
                              that navigates to the full transaction list.
                              Only shown when there are transactions to navigate to.
                            */}
                            <View className="px-6 mb-4 flex-row items-center justify-between">
                                <ThemedText
                                    type="subtitle"
                                    className="text-textPrimary dark:text-dark-textPrimary flex-1 mr-3"
                                    numberOfLines={1}
                                >
                                    Recent Activity
                                </ThemedText>
                                {recentTransactions.length > 0 && (
                                    <Link href="/(tabs)/transactions" asChild>
                                        <Pressable
                                            accessibilityRole="link"
                                            accessibilityLabel="See all transactions"
                                            android_ripple={{ color: STATE_LAYER_COLOR, borderless: true }}
                                        >
                                            <ThemedText className="text-sm font-semibold text-brand-primary">
                                                See all
                                            </ThemedText>
                                        </Pressable>
                                    </Link>
                                )}
                            </View>

                            <View className="px-6">
                                {recentTransactions.length === 0 ? (
                                    /*
                                      M3 Empty State container
                                      rounded-2xl = Shape.Large (16dp) — was rounded-3xl (24dp)
                                      border-borderSoft = outline-variant — was border-dashed border-borderStrong
                                      (M3 has no dashed borders)
                                    */
                                    <EmptyState
                                        icon="receipt-outline"
                                        title="No Transactions Yet"
                                        subtitle="Add your first expense or income to get started."
                                        compact
                                        animated={false}
                                    />
                                ) : (
                                    recentTransactions.map((tx, index) => (
                                        <TransactionItem
                                            key={tx.id}
                                            tx={tx}
                                            index={index}
                                            currency={profile.currency}
                                        />
                                    ))
                                )}
                            </View>
                        </>
                    )}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    pressedOverlay: {
        backgroundColor: STATE_LAYER_COLOR,
    },
});
