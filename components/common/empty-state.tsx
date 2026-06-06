import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { AppButton } from './app-button';
import { ThemedText } from './themed-text';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface EmptyStateProps {
  icon: IoniconsName;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Tint color for the icon and icon background. Defaults to textMuted. */
  iconColor?: string;
  /** Override just the background of the icon circle. */
  iconBg?: string;
  /** Color of the CTA button. Defaults to primary. */
  actionColor?: string;
  /** Use smaller sizing when nested inside a card/section. */
  compact?: boolean;
  /** Wrap in FadeInDown animation. Default false — animating an empty-state
   *  right after a skeleton disappears looks like a screen glitch. Pass
   *  `animated` explicitly when you actually want the slide-in. */
  animated?: boolean;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  iconColor,
  iconBg,
  actionColor,
  compact = false,
  animated = false,
}: EmptyStateProps) {
  const colors = useThemeColors();

  const resolvedIconColor = iconColor ?? colors.textMuted;
  const resolvedIconBg = iconBg ?? (iconColor ? `${iconColor}18` : colors.surfaceAlt);
  const resolvedActionColor = actionColor ?? colors.primary;

  const iconSize = compact ? 28 : 38;
  const containerSize = compact ? 'w-16 h-16' : 'w-20 h-20';
  const titleClass = compact
    ? 'text-base font-bold text-center text-textPrimary dark:text-dark-textPrimary mb-1'
    : 'text-xl font-bold text-center text-textPrimary dark:text-dark-textPrimary mb-2';
  const subtitleClass = compact
    ? 'text-xs text-center text-textMuted dark:text-dark-textMuted'
    : 'text-sm text-center text-textMuted dark:text-dark-textMuted leading-relaxed';
  const paddingClass = compact ? 'py-10 px-6 items-center' : 'py-16 px-6 items-center';

  const content = (
    <View className={paddingClass}>
      <View
        className={`${containerSize} rounded-3xl items-center justify-center mb-5`}
        style={{ backgroundColor: resolvedIconBg }}
      >
        <Ionicons name={icon} size={iconSize} color={resolvedIconColor} />
      </View>

      <ThemedText className={titleClass}>{title}</ThemedText>

      {!!subtitle && (
        <ThemedText className={`${subtitleClass} ${actionLabel ? 'mb-8' : ''}`}>
          {subtitle}
        </ThemedText>
      )}

      {!!actionLabel && !!onAction && (
        <AppButton
          label={actionLabel}
          onPress={onAction}
          color={resolvedActionColor}
          size="md"
        />
      )}
    </View>
  );

  if (!animated) return content;

  return (
    <Animated.View entering={FadeInDown.duration(400).easing(Easing.out(Easing.cubic))}>
      {content}
    </Animated.View>
  );
}
