import { AppButton, ThemedText } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Modal, View } from 'react-native';
import Animated, { Easing, FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DeleteConfirmSheetProps {
  visible: boolean;
  loanPersonName: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}

export function DeleteConfirmSheet({ visible, loanPersonName, onConfirm, onClose, loading }: DeleteConfirmSheetProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <Animated.View
          entering={FadeInUp.duration(300).easing(Easing.out(Easing.cubic))}
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
          <View className="w-12 h-1.5 rounded-full mx-auto mb-6" style={{ backgroundColor: colors.borderStrong }} />

          <View
            className="w-16 h-16 rounded-2xl items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${colors.error}15` }}
          >
            <Ionicons name="trash-outline" size={28} color={colors.error} />
          </View>

          <ThemedText className="text-xl font-semibold text-center text-textPrimary dark:text-dark-textPrimary mb-2">
            Delete Loan?
          </ThemedText>
          <ThemedText className="text-sm text-center mb-8 text-textMuted dark:text-dark-textMuted">
            {'Loan record for "'}{loanPersonName}{'" will be removed. Related transactions stay in your history.'}
          </ThemedText>

          <View className="gap-3">
            <AppButton label="Delete" onPress={onConfirm} variant="destructive" loading={loading} disabled={loading} />
            <AppButton label="Cancel" onPress={onClose} variant="secondary" disabled={loading} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
