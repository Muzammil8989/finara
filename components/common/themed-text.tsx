import { useThemeColor } from '@/hooks/use-theme-color';
import { Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'small';
  className?: string;
};

// Standard text size/alignment utilities (not color-related)
const NON_COLOR_TEXT_CLASSES = new Set([
  'text-xs', 'text-sm', 'text-base', 'text-lg',
  'text-xl', 'text-2xl', 'text-3xl', 'text-4xl',
  'text-5xl', 'text-6xl',
  'text-center', 'text-left', 'text-right', 'text-justify',
]);

// Our custom semantic theme text classes — treat as non-explicit color
// (the inline theme color is the same value, so it's a safe fallback)
const THEME_TEXT_CLASSES = new Set([
  'text-textPrimary', 'text-textSecondary', 'text-textMuted',
  'text-dark-textPrimary', 'text-dark-textSecondary', 'text-dark-textMuted',
]);

/**
 * Check if className has a standard NativeWind color class
 * (e.g. text-white, text-red-500, text-emerald-500/60).
 * Returns false for our custom theme classes and non-color utilities.
 */
function hasStandardColorClass(className: string | undefined): boolean {
  if (!className) return false;
  const tokens = className.split(/\s+/);
  for (const token of tokens) {
    const base = token.startsWith('dark:') ? token.substring(5) : token;
    if (!base.startsWith('text-')) continue;
    if (NON_COLOR_TEXT_CLASSES.has(base)) continue;
    if (THEME_TEXT_CLASSES.has(base)) continue;
    // Arbitrary size values like text-[10px] — not a color
    if (base.startsWith('text-[') && !base.match(/text-\[#[0-9A-Fa-f]/)) continue;
    // Anything else starting with text- is a color class
    return true;
  }
  return false;
}

// Maps ThemedText type → Plus Jakarta Sans font file (weight embedded in name)
const TYPE_FONT: Record<string, string> = {
  title:          'PlusJakartaSans_700Bold',
  subtitle:       'PlusJakartaSans_600SemiBold',
  defaultSemiBold:'PlusJakartaSans_600SemiBold',
  link:           'PlusJakartaSans_600SemiBold',
  small:          'PlusJakartaSans_400Regular',
  default:        'PlusJakartaSans_400Regular',
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  className,
  ...rest
}: ThemedTextProps) {
  const defaultColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const hasExplicitColor = hasStandardColorClass(className);

  let typeClasses = '';
  switch (type) {
    case 'title':
      typeClasses = 'text-3xl font-bold leading-tight';
      break;
    case 'subtitle':
      typeClasses = 'text-xl font-semibold';
      break;
    case 'defaultSemiBold':
      typeClasses = 'text-base font-semibold leading-relaxed';
      break;
    case 'link':
      typeClasses = 'text-base leading-relaxed text-brand-primary';
      break;
    case 'small':
      typeClasses = 'text-sm';
      break;
    default:
      typeClasses = 'text-base leading-relaxed';
  }

  return (
    <Text
      allowFontScaling={false}
      {...rest}
      className={`${typeClasses} ${className || ''}`}
      style={[
        { fontFamily: TYPE_FONT[type] ?? 'PlusJakartaSans_400Regular' },
        !hasExplicitColor ? { color: defaultColor } : null,
        style,
      ]}
    />
  );
}
