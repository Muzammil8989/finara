import { AppCard, ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { LoanWithDetails } from '@/lib/db/queries';
import { UserService } from '@/services/user-service';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

interface LoanItemProps {
  loan: LoanWithDetails;
  currencyCode: string;
  onEdit: (loan: LoanWithDetails) => void;
  onDelete: (loan: LoanWithDetails) => void;
  onRecordPayment: (loan: LoanWithDetails) => void;
  onTransfer: (loan: LoanWithDetails) => void;
}

export function LoanItem({ loan, currencyCode, onEdit, onDelete, onRecordPayment, onTransfer }: LoanItemProps) {
  const colors = useThemeColors();

  const isGiven = loan.type === 'given';
  const isSettled = loan.is_settled === 1;
  const accentColor = isGiven ? colors.warning : colors.info;
  const progressPct = loan.amount > 0 ? Math.min(1, loan.settled_amount / loan.amount) : 0;

  const dueDateColor = (() => {
    if (isSettled || !loan.due_date) return colors.textMuted;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(loan.due_date); due.setHours(0, 0, 0, 0);
    const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return colors.error;
    if (diff <= 7) return colors.warning;
    return colors.textMuted;
  })();

  const dueDateLabel = loan.due_date ? (() => {
    if (isSettled) return `Due ${formatDate(loan.due_date)}`;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(loan.due_date); due.setHours(0, 0, 0, 0);
    const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return `Overdue · ${formatDate(loan.due_date)}`;
    if (diff === 0) return 'Due Today';
    if (diff === 1) return 'Due Tomorrow';
    if (diff <= 7) return `Due in ${Math.round(diff)} days`;
    return `Due ${formatDate(loan.due_date)}`;
  })() : null;

  // Badge color — settled = green, otherwise accent
  const badgeColor = isSettled ? colors.success : accentColor;
  const badgeLabel = isSettled ? 'Settled' : isGiven ? 'Given' : 'Taken';

  return (
    <AppCard accentColor={accentColor}>

      {/* ── Header row ──────────────────────────────────────────── */}
      <View className="flex-row items-center mb-3">
        <View className="items-center justify-center mr-3 shrink-0" style={{ width: 36, height: 36 }}>
          <Ionicons
            name={isGiven ? 'arrow-up-outline' : 'arrow-down-outline'}
            size={20}
            color={accentColor}
          />
        </View>

        <View className="flex-1">
          <ThemedText
            className="font-semibold text-sm text-textPrimary dark:text-dark-textPrimary"
            numberOfLines={1}
          >
            {loan.person_name}
          </ThemedText>
          <ThemedText className="text-[10px] font-semibold" style={{ color: `${accentColor}99` }}>
            {loan.accountName} · {formatDate(loan.date)}
          </ThemedText>
        </View>

        {/* Badge */}
        <View
          className="px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: `${badgeColor}18`,
            borderWidth: 1,
            borderColor: `${badgeColor}35`,
          }}
        >
          <ThemedText className="text-[10px] font-bold" style={{ color: badgeColor }}>
            {badgeLabel.toUpperCase()}
          </ThemedText>
        </View>
      </View>

      {/* ── Progress bar (active only) ───────────────────────────── */}
      {!isSettled && (
        <View className="h-2 bg-borderStrong dark:bg-dark-borderStrong rounded-full overflow-hidden mb-2">
          <View
            style={{ width: `${progressPct * 100}%`, backgroundColor: colors.success }}
            className="h-full rounded-full"
          />
        </View>
      )}

      {/* ── Figures row ─────────────────────────────────────────── */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-1 mr-2">
          <ThemedText
            className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
            style={{ color: colors.textMuted }}
          >
            {isSettled ? 'Total' : 'Remaining'}
          </ThemedText>
          <ThemedText
            className="font-bold text-sm"
            numberOfLines={1}
            style={{
              color: isSettled ? colors.success : accentColor,
              fontFamily: 'SpaceGrotesk_700Bold',
            }}
          >
            {UserService.formatCurrency(
              isSettled ? loan.amount : loan.remaining_amount,
              currencyCode,
            )}
          </ThemedText>
        </View>

        {!isSettled && loan.settled_amount > 0 && (
          <View className="items-end flex-shrink-0">
            <ThemedText
              className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
              style={{ color: colors.textMuted }}
            >
              Paid
            </ThemedText>
            <ThemedText
              className="text-sm font-bold"
              style={{ color: colors.success, fontFamily: 'SpaceGrotesk_700Bold' }}
            >
              {UserService.formatCurrency(loan.settled_amount, currencyCode)}
            </ThemedText>
          </View>
        )}

        {!isSettled && (
          <View className="items-end flex-shrink-0 ml-3">
            <ThemedText
              className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
              style={{ color: colors.textMuted }}
            >
              Total
            </ThemedText>
            <ThemedText
              className="text-[11px] font-semibold"
              style={{ color: colors.textMuted, fontFamily: 'SpaceGrotesk_600SemiBold' }}
            >
              {UserService.formatCurrency(loan.amount, currencyCode)}
            </ThemedText>
          </View>
        )}
      </View>

      {/* ── Due date row ─────────────────────────────────────────── */}
      {dueDateLabel && (
        <View className="flex-row items-center gap-1 mb-3">
          <Ionicons name="time-outline" size={11} color={dueDateColor} />
          <ThemedText className="text-[10px] font-semibold" style={{ color: dueDateColor }}>
            {dueDateLabel}
          </ThemedText>
        </View>
      )}

      {/* ── Divider ─────────────────────────────────────────────── */}
      <View className="h-px bg-divider dark:bg-dark-divider mb-3" />

      {/* ── Action chips ────────────────────────────────────────── */}
      {!isSettled ? (
        <View className="flex-row gap-2 justify-end">
          <Pressable
            onPress={() => onRecordPayment(loan)}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ backgroundColor: `${colors.success}18` }}
          >
            <Ionicons name="checkmark-circle-outline" size={13} color={colors.success} />
            <ThemedText className="text-[11px] font-semibold" style={{ color: colors.success }}>
              {isGiven ? 'Repaid' : 'Pay'}
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => onEdit(loan)}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ backgroundColor: `${colors.primary}15` }}
          >
            <Ionicons name="pencil-outline" size={13} color={colors.primary} />
            <ThemedText className="text-[11px] font-semibold" style={{ color: colors.primary }}>
              Edit
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => onDelete(loan)}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ backgroundColor: `${colors.error}15` }}
          >
            <Ionicons name="trash-outline" size={13} color={colors.error} />
            <ThemedText className="text-[11px] font-semibold" style={{ color: colors.error }}>
              Delete
            </ThemedText>
          </Pressable>
        </View>
      ) : loan.transaction_id === null ? (
        <Pressable
          onPress={() => onTransfer(loan)}
          className="flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl"
          style={{ backgroundColor: `${colors.primary}15` }}
        >
          <Ionicons name="arrow-forward-circle-outline" size={15} color={colors.primary} />
          <ThemedText className="text-[11px] font-bold" style={{ color: colors.primary }}>
            Transfer to Account
          </ThemedText>
        </Pressable>
      ) : (
        <View className="flex-row items-center justify-center gap-1.5 py-2">
          <Ionicons name="checkmark-circle" size={13} color={colors.success} />
          <ThemedText className="text-[11px] font-semibold" style={{ color: colors.success }}>
            Transferred to account
          </ThemedText>
        </View>
      )}
    </AppCard>
  );
}
