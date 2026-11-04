import { useThemeColors } from '@/hooks/use-theme-colors';
import { fonts } from '@/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export interface AppButtonProps {
  label: string;
  onPress: () => void;
  /** primary=brand fill | secondary=muted fill | destructive=error fill */
  variant?: 'primary' | 'secondary' | 'destructive';
  /** md=full-height CTA (py-4) | sm=compact row button (py-2.5) */
  size?: 'sm' | 'md';
  loading?: boolean;
  disabled?: boolean;
  /** Override background color — use for dynamic-colored buttons */
  color?: string;
  /** Leading Ionicon name */
  icon?: IoniconsName;
  /** flex:1 so the button fills its flex container */
  flex?: boolean;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  color,
  icon,
  flex = false,
}: AppButtonProps) {
  const colors = useThemeColors();

  const isDisabled = disabled || loading;

  // ── Background color ──────────────────────────────────────────────────────
  const bgColor = color ?? (
    variant === 'primary'     ? colors.primary :
    variant === 'destructive' ? colors.error   :
    colors.surfaceAlt
  );

  // ── Text / icon color ─────────────────────────────────────────────────────
  const fgColor = variant === 'secondary'
    ? colors.textPrimary
    : '#FFFFFF';

  // ── Sizing ─────────────────────────────────────────────────────────────────
  const paddingVertical = size === 'sm' ? 10 : 14;
  const minHeight = size === 'sm' ? 44 : 52;
  const paddingHorizontal = size === 'sm' ? 20 : 24;
  const fontSize = size === 'sm' ? 14 : 16;

  // ── Secondary border ──────────────────────────────────────────────────────
  const secondaryBorder = variant === 'secondary'
    ? { borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: 'transparent' }
    : undefined;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      android_ripple={{ color: colors.btnGhostBgPressed, borderless: false }}
      style={[
        styles.base,
        { paddingVertical, paddingHorizontal, minHeight, backgroundColor: bgColor },
        secondaryBorder,
        flex && { flex: 1 },
        isDisabled && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: loading, disabled: isDisabled }}
    >
      {({ pressed }) => (
        <>
          {loading ? (
            <ActivityIndicator color={fgColor} size="small" />
          ) : (
            <View style={styles.row}>
              {!!icon && (
                <Ionicons name={icon} size={fontSize + 2} color={fgColor} style={styles.icon} />
              )}
              <ThemedText
                style={{
                  color: fgColor,
                  fontSize,
                  fontFamily: fonts.sansSemiBold,
                  letterSpacing: 0.1,
                }}
              >
                {label}
              </ThemedText>
            </View>
          )}

          {/* iOS pressed state layer */}
          {pressed && Platform.OS === 'ios' && (
            <View style={[StyleSheet.absoluteFillObject, styles.pressedOverlay]} pointerEvents="none" />
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  pressedOverlay: {
    backgroundColor: 'rgba(0,0,0,0.07)',
  },
});
