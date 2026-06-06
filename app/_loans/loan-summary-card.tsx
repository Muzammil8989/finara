import { AppCard, ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { LoanSummary } from '@/hooks/use-loans';
import { UserService } from '@/services/user-service';
import React from 'react';
import { View } from 'react-native';

interface LoanSummaryCardProps {
  summary: LoanSummary;
  currencyCode: string;
}

export function LoanSummaryCard({ summary, currencyCode }: LoanSummaryCardProps) {
  const colors = useThemeColors();

  const net = summary.totalGiven - summary.totalTaken;
  const netLabel = net > 0
    ? `You are owed ${UserService.formatCurrency(net, currencyCode)}`
    : net < 0
    ? `You owe ${UserService.formatCurrency(Math.abs(net), currencyCode)}`
    : 'All settled up';
  const netColor = net > 0 ? colors.warning : net < 0 ? colors.info : colors.success;

  return (
    <AppCard accentColor={netColor} className="mx-6 mb-4 p-0">
      <View className="flex-row">
        {/* Given Out */}
        <View
          className="flex-1 p-5"
          style={{ borderRightWidth: 1, borderRightColor: colors.divider }}
        >
          <View className="flex-row items-center gap-2 mb-2">
            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.warning }} />
            <ThemedText className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.textMuted }}>
              Given Out
            </ThemedText>
          </View>
          <ThemedText className="text-lg font-black" style={{ color: colors.warning, fontFamily: 'SpaceGrotesk_700Bold' }}>
            {UserService.formatCurrency(summary.totalGiven, currencyCode)}
          </ThemedText>
          <ThemedText className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
            pending recovery
          </ThemedText>
        </View>

        {/* Taken */}
        <View className="flex-1 p-5">
          <View className="flex-row items-center gap-2 mb-2">
            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.info }} />
            <ThemedText className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.textMuted }}>
              Taken
            </ThemedText>
          </View>
          <ThemedText className="text-lg font-black" style={{ color: colors.info, fontFamily: 'SpaceGrotesk_700Bold' }}>
            {UserService.formatCurrency(summary.totalTaken, currencyCode)}
          </ThemedText>
          <ThemedText className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
            pending repayment
          </ThemedText>
        </View>
      </View>

      {/* Net line */}
      <View
        className="px-5 py-3 flex-row items-center justify-center"
        style={{ borderTopWidth: 1, borderTopColor: colors.divider }}
      >
        <ThemedText className="text-sm font-bold" style={{ color: netColor }}>
          {netLabel}
        </ThemedText>
      </View>
    </AppCard>
  );
}
