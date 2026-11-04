/**
 * Overview — the home tab, laid out like the front page of a report:
 *
 *   masthead      date kicker, serif greeting, avatar → Settings
 *   balance       current balance + how much it moved this month
 *   this month    money in / money out, with the change vs last month
 *   cash flow     6-month income vs spending bars
 *   watch list    budgets past their alert threshold (only when any are)
 *   savings       one-line progress across all goals
 *   recent        last 5 transactions
 *   tools         Bills, Household, Loans, Accounts, Categories, Export
 */

import { EmptyState, IconSymbol, ProgressRing, Rule, Section, Skeleton, StatFigure, ThemedText } from '@/components/common';
import { useAccounts } from '@/features/accounts/hooks/use-accounts';
import { BudgetCard } from '@/features/budgets/components/budget-card';
import { useBudgets } from '@/features/budgets/hooks/use-budgets';
import { getBudgetStatus } from '@/features/budgets/utils';
import { ToolsGrid } from '@/features/overview/components/tools-grid';
import { TransactionItem } from '@/features/overview/components/transaction-item';
import { CashflowBars } from '@/features/reports/components/cashflow-bars';
import { useChartWidth } from '@/features/reports/utils';
import { useSavingsGoals } from '@/features/savings/hooks/use-savings-goals';
import { useTransactions } from '@/features/transactions/hooks/use-transactions';
import { useUser } from '@/features/user/context/user-context';
import { UserService } from '@/features/user/services/user-service';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { getMonthlyTotals, isTransferCategory, type MonthlyTotals } from '@/lib/db/queries';
import { parseLocalDate, toISODateString } from '@/lib/utils/date';
import { logger } from '@/lib/logger';
import { useModals } from '@/providers/modal-context';
import { Image } from 'expo-image';
import { type Href, router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { InteractionManager, RefreshControl, View } from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedReaction,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    type SharedValue,
} from 'react-native-reanimated';
import { Pressable } from '@/components/common/pressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function greeting(now: Date): string {
    const h = now.getHours();
    if (h < 5) return 'Good evening';
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
}

/** "YYYY-MM" for a date offset by `delta` months. */
function monthKey(now: Date, delta = 0): string {
    const d = new Date(now.getFullYear(), now.getMonth() + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function pctChange(current: number, previous: number): number | null {
    if (previous <= 0) return null;
    return ((current - previous) / previous) * 100;
}

/** Scroll distance after which the big balance has left the screen. */
const STICKY_START = 140;
const STICKY_END = 190;

/**
 * Compact header that slides in once the masthead and balance have scrolled
 * away, so your name and balance stay visible while you read the rest.
 */
function StickyHeader({
    scrollY, topInset, name, avatar, balance, onAvatarPress,
}: {
    scrollY: SharedValue<number>;
    topInset: number;
    name: string;
    avatar: string | null;
    balance: string;
    onAvatarPress: () => void;
}) {
    const colors = useThemeColors();
    const [interactive, setInteractive] = useState(false);

    useAnimatedReaction(
        () => scrollY.value > STICKY_START + 20,
        (now, prev) => { if (now !== prev) runOnJS(setInteractive)(now); },
    );

    const style = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [STICKY_START, STICKY_END], [0, 1], Extrapolation.CLAMP),
        transform: [{ translateY: interpolate(scrollY.value, [STICKY_START, STICKY_END], [-10, 0], Extrapolation.CLAMP) }],
    }));

    return (
        <Animated.View
            pointerEvents={interactive ? 'auto' : 'none'}
            accessibilityElementsHidden={!interactive}
            importantForAccessibility={interactive ? 'auto' : 'no-hide-descendants'}
            style={[
                {
                    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
                    paddingTop: topInset, backgroundColor: colors.background,
                    borderBottomWidth: 1, borderBottomColor: colors.divider,
                },
                style,
            ]}
        >
            <View className="flex-row items-center px-5" style={{ height: 56 }}>
                <Pressable
                    onPress={onAvatarPress}
                    accessibilityRole="button"
                    accessibilityLabel="Profile and settings"
                    className="w-9 h-9 rounded-full items-center justify-center overflow-hidden border border-divider dark:border-dark-divider mr-3"
                    style={{ backgroundColor: colors.surface }}
                >
                    {avatar ? (
                        <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    ) : (
                        <IconSymbol name="person.fill" color={colors.textSecondary} size={16} />
                    )}
                </Pressable>
                <ThemedText type="headline" className="flex-1 text-[19px] leading-6" numberOfLines={1}>
                    {name || 'Overview'}
                </ThemedText>
                <View className="items-end ml-3" accessible accessibilityLabel={`Current balance: ${balance}`}>
                    <ThemedText type="kicker" className="text-[10px] mb-0.5">Balance</ThemedText>
                    <ThemedText type="figure" className="text-[16px]" numberOfLines={1}>{balance}</ThemedText>
                </View>
            </View>
        </Animated.View>
    );
}

function OverviewSkeleton() {
    return (
        <View className="px-5">
            <Skeleton width="45%" height={12} borderRadius={4} style={{ marginBottom: 10 }} />
            <Skeleton width="70%" height={40} borderRadius={6} style={{ marginBottom: 28 }} />
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 28 }}>
                <Skeleton height={56} borderRadius={6} style={{ flex: 1 }} />
                <Skeleton height={56} borderRadius={6} style={{ flex: 1 }} />
            </View>
            <Skeleton height={140} borderRadius={6} style={{ marginBottom: 28 }} />
            {[0, 1, 2, 3].map(i => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}>
                    <Skeleton width={36} height={36} borderRadius={18} />
                    <View style={{ flex: 1, marginHorizontal: 12 }}>
                        <Skeleton width="50%" height={13} borderRadius={4} style={{ marginBottom: 6 }} />
                        <Skeleton width="30%" height={10} borderRadius={4} />
                    </View>
                    <Skeleton width={64} height={13} borderRadius={4} />
                </View>
            ))}
        </View>
    );
}

export default function OverviewScreen() {
    const { profile } = useUser();
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const chartWidth = useChartWidth() - 8;
    const { refreshSignal, openModal } = useModals();
    const { transactions, loading: txLoading, refresh } = useTransactions();
    const { goals, loading: goalsLoading, refresh: refreshGoals } = useSavingsGoals();
    const { accounts, refresh: refreshAccounts } = useAccounts();
    const { budgets, refresh: refreshBudgets } = useBudgets();
    const [monthly, setMonthly] = useState<MonthlyTotals[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const scrollY = useSharedValue(0);
    const onScroll = useAnimatedScrollHandler({ onScroll: e => { scrollY.value = e.contentOffset.y; } });

    const loading = txLoading || goalsLoading;
    const showSkeleton = loading && transactions.length === 0;
    const currency = profile.currency;
    // Re-evaluated when the calendar day changes, so "this month" rolls over
    // even if the tab stays mounted across midnight.
    const today = toISODateString(new Date());
    const now = useMemo(() => parseLocalDate(today), [today]);

    const loadMonthly = useCallback(async () => {
        try {
            setMonthly(await getMonthlyTotals(6));
        } catch (e) {
            logger.error('Failed to load monthly totals', e);
        }
    }, []);

    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => { loadMonthly(); });
        return () => task.cancel();
    }, [loadMonthly, refreshSignal]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await Promise.all([refresh(), refreshGoals(), refreshAccounts(), refreshBudgets(), loadMonthly()]);
        setIsRefreshing(false);
    }, [refresh, refreshGoals, refreshAccounts, refreshBudgets, loadMonthly]);

    const stats = useMemo(() => {
        const thisKey = monthKey(now);
        const lastKey = monthKey(now, -1);
        let income = 0, expense = 0, lastIncome = 0, lastExpense = 0, allIncome = 0, allExpense = 0;
        for (const t of transactions) {
            const k = t.date?.slice(0, 7);
            const isIncome = t.type === 'income';
            if (isIncome) allIncome += t.amount; else allExpense += t.amount;
            // Lending/borrowing moves the balance but isn't income or spending.
            if (isTransferCategory(t.category)) continue;
            // "So far": scheduled (future-dated) entries don't count yet.
            if (t.date && t.date > today) continue;
            if (k === thisKey) { if (isIncome) income += t.amount; else expense += t.amount; }
            else if (k === lastKey) { if (isIncome) lastIncome += t.amount; else lastExpense += t.amount; }
        }
        // Account balances already include opening balances + all transactions,
        // so the total matches Payment Methods and the add-expense balance check.
        const balance = accounts.length
            ? accounts.reduce((sum, a) => sum + a.balance, 0)
            : allIncome - allExpense;
        return {
            balance,
            income,
            expense,
            net: income - expense,
            incomeDelta: pctChange(income, lastIncome),
            expenseDelta: pctChange(expense, lastExpense),
        };
    }, [transactions, accounts, now, today]);

    const atRisk = useMemo(
        () => budgets
            .filter(b => getBudgetStatus(b.percentUsed, b.alert_threshold ?? 80).tone !== 'ok')
            .sort((a, b) => b.percentUsed - a.percentUsed)
            .slice(0, 2),
        [budgets],
    );

    const savings = useMemo(() => {
        const active = goals.filter(g => g.is_completed !== 1);
        const target = goals.reduce((s, g) => s + g.target_amount, 0);
        const saved = goals.reduce((s, g) => s + g.saved_amount, 0);
        return { count: goals.length, active: active.length, target, saved, pct: target > 0 ? (saved / target) * 100 : 0 };
    }, [goals]);

    const recent = useMemo(() => transactions.slice(0, 5), [transactions]);
    const hasCashflow = monthly.some(m => m.income > 0 || m.expense > 0);
    const spentShare = stats.income > 0 ? Math.min((stats.expense / stats.income) * 100, 100) : 0;
    const firstName = (profile.name || '').trim().split(/\s+/)[0];

    return (
        <View className="flex-1 bg-background dark:bg-dark-background">
            {!showSkeleton && (
                <StickyHeader
                    scrollY={scrollY}
                    topInset={insets.top}
                    name={firstName || profile.name}
                    avatar={profile.avatar ?? null}
                    balance={UserService.formatCurrency(stats.balance, currency)}
                    onAvatarPress={() => router.push('/settings' as Href)}
                />
            )}
            <Animated.ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 120 }}
                showsVerticalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* ── Masthead ───────────────────────────────────────────── */}
                <View className="px-5 pt-4 pb-5 flex-row items-start">
                    <View className="flex-1 pr-3">
                        <ThemedText type="kicker" className="mb-1.5">
                            {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                        </ThemedText>
                        <ThemedText type="display" numberOfLines={2} accessibilityRole="header">
                            {greeting(new Date())}{firstName ? `,\n${firstName}` : ''}
                        </ThemedText>
                    </View>
                    <Pressable
                        onPress={() => router.push('/settings' as Href)}
                        accessibilityRole="button"
                        accessibilityLabel="Profile and settings"
                        className="w-12 h-12 rounded-full items-center justify-center overflow-hidden border border-divider dark:border-dark-divider mt-1"
                        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, backgroundColor: colors.surface })}
                    >
                        {profile.avatar ? (
                            <Image source={{ uri: profile.avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        ) : (
                            <IconSymbol name="person.fill" color={colors.textSecondary} size={22} />
                        )}
                    </Pressable>
                </View>

                {showSkeleton ? (
                    <OverviewSkeleton />
                ) : (
                    <>
                        {/* ── Balance ─────────────────────────────────────── */}
                        <View className="px-5">
                            <Rule strong className="mb-4" />
                            <StatFigure
                                label="Current Balance"
                                value={UserService.formatCurrency(stats.balance, currency)}
                                size="lg"
                            />
                            {(stats.income > 0 || stats.expense > 0) && (
                                <ThemedText type="caption" className="mt-1" style={{ fontVariant: ['tabular-nums'] }}>
                                    <ThemedText type="caption" style={{ color: stats.net >= 0 ? colors.income : colors.expense, fontVariant: ['tabular-nums'] }}>
                                        {stats.net >= 0 ? '+' : '−'}{UserService.formatCurrency(Math.abs(stats.net), currency)}
                                    </ThemedText>
                                    {' '}net this month
                                </ThemedText>
                            )}
                        </View>

                        {/* ── This month ──────────────────────────────────── */}
                        <View className="px-5 mt-6">
                            <Rule className="mb-4" />
                            <ThemedText type="kicker" className="mb-3">
                                {now.toLocaleDateString(undefined, { month: 'long' })} so far
                            </ThemedText>
                            <View className="flex-row">
                                <View className="flex-1">
                                    <StatFigure
                                        label="Money in"
                                        value={UserService.formatCurrency(stats.income, currency)}
                                        delta={stats.incomeDelta}
                                        deltaCaption="vs last month"
                                    />
                                </View>
                                <View className="w-px bg-divider dark:bg-dark-divider mx-4" />
                                <View className="flex-1">
                                    <StatFigure
                                        label="Money out"
                                        value={UserService.formatCurrency(stats.expense, currency)}
                                        delta={stats.expenseDelta}
                                        deltaCaption="vs last month"
                                        invertDelta
                                    />
                                </View>
                            </View>
                            {stats.income > 0 && (
                                <View className="mt-4">
                                    <View className="h-1 rounded-full bg-backgroundAlt dark:bg-dark-surfaceAlt overflow-hidden">
                                        <View
                                            className="h-full rounded-full"
                                            style={{ width: `${spentShare}%`, backgroundColor: stats.expense > stats.income ? colors.expense : colors.primary }}
                                        />
                                    </View>
                                    <ThemedText type="caption" className="mt-1.5">
                                        {stats.expense > stats.income
                                            ? `You've spent ${UserService.formatCurrency(stats.expense - stats.income, currency)} more than came in.`
                                            : `You've spent ${Math.round(spentShare)}% of what came in.`}
                                    </ThemedText>
                                </View>
                            )}
                        </View>

                        {/* ── Cash flow ───────────────────────────────────── */}
                        {hasCashflow && (
                            <Section
                                kicker="Last 6 months"
                                title="Cash flow"
                                actionLabel="Insights"
                                onAction={() => router.push('/(tabs)/reports' as Href)}
                            >
                                <CashflowBars data={monthly} currency={currency} width={chartWidth} height={150} compact />
                            </Section>
                        )}

                        {/* ── Watch list: budgets at or past their alert ─── */}
                        {atRisk.length > 0 && (
                            <Section
                                kicker="Needs attention"
                                title="Budgets to watch"
                                actionLabel="All budgets"
                                onAction={() => router.push('/(tabs)/budget' as Href)}
                            >
                                {atRisk.map(b => (
                                    <BudgetCard
                                        key={b.id}
                                        budget={b}
                                        currency={currency}
                                        onEdit={budget => openModal('budget', { budget })}
                                        onDelete={budget => openModal('budget', { budget })}
                                    />
                                ))}
                            </Section>
                        )}

                        {/* ── Savings ─────────────────────────────────────── */}
                        {savings.count > 0 && (
                            <Section title="Savings" actionLabel="Goals" onAction={() => router.push('/(tabs)/savings' as Href)}>
                                <View className="flex-row items-center">
                                    <ProgressRing percent={savings.pct} size={52} stroke={4} />
                                    <View className="flex-1 ml-4">
                                        <ThemedText type="figure" className="text-lg">
                                            {UserService.formatCurrency(savings.saved, currency)}
                                            <ThemedText type="caption" style={{ fontVariant: ['tabular-nums'] }}>
                                                {' '}of {UserService.formatCurrency(savings.target, currency)}
                                            </ThemedText>
                                        </ThemedText>
                                        <ThemedText type="caption">
                                            {savings.active === 0
                                                ? 'Every goal reached'
                                                : `${savings.active} active ${savings.active === 1 ? 'goal' : 'goals'}`}
                                        </ThemedText>
                                    </View>
                                </View>
                            </Section>
                        )}

                        {/* ── Recent ──────────────────────────────────────── */}
                        <Section
                            title="Recent activity"
                            actionLabel={recent.length > 0 ? 'See all' : undefined}
                            onAction={recent.length > 0 ? () => router.push('/(tabs)/transactions' as Href) : undefined}
                        >
                            {recent.length === 0 ? (
                                <EmptyState
                                    icon="receipt-outline"
                                    title="Nothing recorded yet"
                                    subtitle="Tap + to add your first expense or income."
                                    compact
                                />
                            ) : (
                                recent.map((tx, i) => (
                                    <TransactionItem key={tx.id} tx={tx} currency={currency} ruled={i < recent.length - 1} />
                                ))
                            )}
                        </Section>

                        {/* ── Tools ───────────────────────────────────────── */}
                        <Section title="Tools">
                            <ToolsGrid />
                        </Section>
                    </>
                )}
            </Animated.ScrollView>
        </View>
    );
}
